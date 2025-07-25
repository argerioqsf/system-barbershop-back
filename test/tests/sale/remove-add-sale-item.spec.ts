import { describe, it, expect, beforeEach, vi } from "vitest";
import { RemoveAddSaleItemService } from "../../../src/services/sale/remove-add-sale-item";
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
  makeProduct,
  makeCoupon,
  defaultUnit,
  defaultOrganization,
  defaultUser,
  defaultProfile,
  barberUser,
  barberProfile,
} from "../../helpers/default-values";
import { DiscountOrigin, type Service } from "@prisma/client";
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
let service: RemoveAddSaleItemService;
let svc1: Service;

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
  svc1 = makeService("svc1", 100);
  sale.items[0].serviceId = svc1.id;
  sale.items[0].service = svc1;
  saleRepo.sales.push(sale);
  serviceRepo.services.push(svc1);
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
  service = new RemoveAddSaleItemService(
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

describe("Remove add sale item service", () => {
  it("adds new service item", async () => {
    const svc2 = makeService("svc2", 50);
    serviceRepo.services.push(svc2);

    const result = await service.execute({
      id: "sale-1",
      addItemsIds: [{ serviceId: svc2.id, quantity: 2 }],
    });

    expect(result.sale?.items).toHaveLength(2);
    expect(result.sale?.total).toBe(200);
  });

  it("removes product item and restores stock", async () => {
    const product = makeProduct("p1", 40, 3);
    productRepo.products.push(product);
    saleRepo.sales[0].items[0].serviceId = null;
    saleRepo.sales[0].items[0].service = null;
    saleRepo.sales[0].items[0].barberId = null;
    saleRepo.sales[0].items[0].barber = null as any;
    saleRepo.sales[0].items[0].productId = product.id;
    saleRepo.sales[0].items[0].product = product as any;
    saleRepo.sales[0].total = 40;

    const result = await service.execute({
      id: "sale-1",
      removeItemIds: ["i1"],
    });

    expect(result.sale?.items).toHaveLength(0);
    expect(result.sale?.total).toBe(0);
    expect(productRepo.products[0].quantity).toBe(5);
  });
  it("removes service item", async () => {
    const result = await service.execute({
      id: "sale-1",
      removeItemIds: ["i1"],
    });

    expect(result.sale?.items).toHaveLength(0);
    expect(result.sale?.total).toBe(0);
  });

  it("adds product item and updates stock", async () => {
    const product = makeProduct("prod2", 30, 5);
    productRepo.products.push(product);

    const result = await service.execute({
      id: "sale-1",
      addItemsIds: [{ productId: product.id, quantity: 1 }],
    });

    expect(result.sale?.items).toHaveLength(2);
    expect(result.sale?.total).toBe(130);
    expect(productRepo.products[0].quantity).toBe(4);
  });

  it("applies coupon discount when adding new item", async () => {
    const coupon = makeCoupon("c3", "OFF", 20, "VALUE");
    couponRepo.coupons.push(coupon);
    saleRepo.sales[0].couponId = coupon.id;
    saleRepo.sales[0].coupon = coupon;

    const svc2 = makeService("svc2", 50);
    serviceRepo.services.push(svc2);

    const result = await service.execute({
      id: "sale-1",
      addItemsIds: [{ serviceId: svc2.id, quantity: 1 }],
    });

    const newItem = result.sale!.items[1];
    expect(newItem.discounts[0]).toEqual(
      expect.objectContaining({ origin: DiscountOrigin.COUPON_SALE }),
    );
    expect(newItem.discounts[0].amount).toBeCloseTo(6.67, 2);
  });

  it("throws when no item changes", async () => {
    await expect(service.execute({ id: "sale-1" })).rejects.toThrow(
      "No item changes detected",
    );
  });

  it("throws when sale not found", async () => {
    await expect(
      service.execute({ id: "invalid", removeItemIds: ["i1"] }),
    ).rejects.toThrow("Sale not found");
  });

  it("throws when user not found", async () => {
    barberRepo.users = [];
    await expect(
      service.execute({ id: "sale-1", removeItemIds: ["i1"] }),
    ).rejects.toThrow("User not found");
  });

  it("throws when sale is paid", async () => {
    saleRepo.sales[0].paymentStatus = "PAID";
    await expect(
      service.execute({ id: "sale-1", removeItemIds: ["i1"] }),
    ).rejects.toThrow("Cannot edit a paid sale");
  });

  it("throws when id is missing", async () => {
    await expect(
      service.execute({ id: "", removeItemIds: ["i1"] }),
    ).rejects.toThrow("Sale ID is required");
  });
});
