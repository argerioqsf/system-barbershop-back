import { describe, it, expect, beforeEach, vi } from "vitest";
import { UpdateCouponSaleService } from "../../../src/services/sale/update-coupon-sale";
import {
  FakeSaleRepository,
  FakeServiceRepository,
  FakeProductRepository,
  FakeAppointmentRepository,
  FakeCouponRepository,
  FakeBarberUsersRepository,
  FakeSaleItemRepository,
  FakePlanRepository,
  FakePlanProfileRepository,
} from "../../helpers/fake-repositories";
import {
  makeSaleWithBarber,
  makeService,
  makeCoupon,
  defaultUnit,
  defaultOrganization,
  defaultUser,
  defaultProfile,
  barberUser,
  barberProfile,
} from "../../helpers/default-values";
import { DiscountOrigin } from "@prisma/client";
import { prisma } from "../../../src/lib/prisma";

let saleRepo: FakeSaleRepository;
let serviceRepo: FakeServiceRepository;
let productRepo: FakeProductRepository;
let appointmentRepo: FakeAppointmentRepository;
let couponRepo: FakeCouponRepository;
let barberRepo: FakeBarberUsersRepository;
let saleItemRepo: FakeSaleItemRepository;
let planRepo: FakePlanRepository;
let planProfileRepo: FakePlanProfileRepository;
let service: UpdateCouponSaleService;

beforeEach(() => {
  saleRepo = new FakeSaleRepository();
  serviceRepo = new FakeServiceRepository();
  productRepo = new FakeProductRepository();
  appointmentRepo = new FakeAppointmentRepository();
  couponRepo = new FakeCouponRepository();
  barberRepo = new FakeBarberUsersRepository();
  saleItemRepo = new FakeSaleItemRepository(saleRepo);
  planRepo = new FakePlanRepository();
  planProfileRepo = new FakePlanProfileRepository();
  const sale = makeSaleWithBarber();
  const svc = makeService("svc1", 100);
  sale.items[0].serviceId = svc.id;
  sale.items[0].service = svc as any;
  saleRepo.sales.push(sale);
  serviceRepo.services.push(svc);
  barberRepo.users.push(
    {
      ...defaultUser,
      id: "cashier",
      organizationId: defaultOrganization.id,
      unitId: defaultUnit.id,
      unit: { ...defaultUnit, organizationId: defaultOrganization.id },
      profile: defaultProfile,
    },
    { ...barberUser, profile: barberProfile },
  );
  service = new UpdateCouponSaleService(
    saleRepo,
    serviceRepo,
    productRepo,
    appointmentRepo,
    couponRepo,
    barberRepo,
    saleItemRepo,
    planRepo,
    planProfileRepo,
  );
  vi.spyOn(prisma, "$transaction").mockImplementation(async (fn) =>
    fn({
      discount: { deleteMany: vi.fn() },
      planProfile: { deleteMany: vi.fn() },
    } as any),
  );
});

describe("Update coupon sale service", () => {
  it("applies coupon to sale", async () => {
    const coupon = makeCoupon("c1", "OFF20", 20, "VALUE");
    couponRepo.coupons.push(coupon);

    const result = await service.execute({ id: "sale-1", couponId: coupon.id });

    expect(result.sale?.couponId).toBe(coupon.id);
    expect(result.sale?.total).toBe(80);
    const item = result.sale!.items[0];
    expect(item.discounts[0]).toEqual(
      expect.objectContaining({ origin: DiscountOrigin.COUPON_SALE }),
    );
    expect(item.discounts[0].amount).toBe(20);
  });

  it("removes coupon from sale", async () => {
    const coupon = makeCoupon("c2", "OFF10", 10, "VALUE");
    couponRepo.coupons.push(coupon);
    saleRepo.sales[0].couponId = coupon.id;
    saleRepo.sales[0].coupon = coupon;
    saleRepo.sales[0].items[0].price = 90;
    saleRepo.sales[0].items[0].discounts = [
      {
        amount: 10,
        type: "VALUE",
        origin: DiscountOrigin.COUPON_SALE,
        order: 1,
      },
    ];
    saleRepo.sales[0].total = 90;

    const result = await service.execute({ id: "sale-1", removeCoupon: true });

    expect(result.sale?.couponId).toBeNull();
    expect(saleRepo.sales[0].couponId).toBeNull();
    const item = result.sale!.items[0];
    expect(item.discounts).toHaveLength(0);
    expect(item.price).toBe(100);
  });
  it("throws when no coupon changes", async () => {
    await expect(service.execute({ id: "sale-1" })).rejects.toThrow(
      "No coupon changes",
    );
  });

  it("throws when id is missing", async () => {
    await expect(
      service.execute({ id: "", removeCoupon: true }),
    ).rejects.toThrow("Sale ID is required");
  });

  it("throws when sale not found", async () => {
    await expect(
      service.execute({ id: "invalid", removeCoupon: true }),
    ).rejects.toThrow("Sale not found");
  });

  it("throws when sale is paid", async () => {
    saleRepo.sales[0].paymentStatus = "PAID";
    await expect(
      service.execute({ id: "sale-1", removeCoupon: true }),
    ).rejects.toThrow("Cannot edit a paid sale");
  });

  it("throws when user not found", async () => {
    barberRepo.users = [];
    await expect(
      service.execute({ id: "sale-1", removeCoupon: true }),
    ).rejects.toThrow("User not found");
  });
});
