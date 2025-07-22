import { describe, it, expect, beforeEach, vi } from "vitest";
import { UpdateClientSaleService } from "../../../src/services/sale/update-client-sale";
import {
  FakeSaleRepository,
  FakeProfilesRepository,
  FakeSaleItemRepository,
  FakePlanRepository,
  FakePlanProfileRepository,
} from "../../helpers/fake-repositories";
import {
  makeSale,
  makeProfile,
  makeService,
  defaultClient,
} from "../../helpers/default-values";
import {
  DiscountOrigin,
  DiscountType,
  type PlanWithBenefits,
  type Service,
} from "@prisma/client";
import { prisma } from "../../../src/lib/prisma";

let saleRepo: FakeSaleRepository;
let profileRepo: FakeProfilesRepository;
let saleItemRepo: FakeSaleItemRepository;
let planRepo: FakePlanRepository;
let planProfileRepo: FakePlanProfileRepository;
let service: UpdateClientSaleService;
let svc: Service;

beforeEach(() => {
  saleRepo = new FakeSaleRepository();
  profileRepo = new FakeProfilesRepository();
  saleItemRepo = new FakeSaleItemRepository(saleRepo);
  planRepo = new FakePlanRepository();
  planProfileRepo = new FakePlanProfileRepository();
  saleRepo.sales.push(makeSale("sale-1"));
  svc = makeService("svc1", 100);
  saleRepo.sales[0].items.push({
    id: "i1",
    saleId: "sale-1",
    serviceId: svc.id,
    productId: null,
    planId: null,
    quantity: 1,
    barberId: null,
    couponId: null,
    price: 100,
    customPrice: null,
    discounts: [],
    porcentagemBarbeiro: 0,
    service: svc,
    product: null,
    plan: null,
    barber: null,
    coupon: null,
    appointmentId: null,
    appointment: null,
    commissionPaid: false,
  });
  const newClient = { ...defaultClient, id: "c2" };
  profileRepo.profiles = [{ ...makeProfile("p-c2", "c2"), user: newClient }];
  service = new UpdateClientSaleService(
    saleRepo,
    profileRepo,
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

describe("Update client sale service", () => {
  it("updates client of sale", async () => {
    const result = await service.execute({ id: "sale-1", clientId: "c2" });

    expect(result.sale?.clientId).toBe("c2");
    expect(saleRepo.sales[0].clientId).toBe("c2");
  });

  it("applies plan discount when new client has plan", async () => {
    const plan: PlanWithBenefits = {
      id: "pl1",
      price: 100,
      name: "Plan",
      typeRecurrenceId: "rec1",
      benefits: [
        {
          id: "bp1",
          planId: "pl1",
          benefitId: "b1",
          benefit: {
            id: "b1",
            name: "B",
            description: null,
            discount: 10,
            discountType: DiscountType.VALUE,
            unitId: defaultClient.unitId,
            categories: [],
            services: [
              { id: "bs1", benefitId: "b1", serviceId: svc.id },
            ],
            products: [],
            plans: [],
          },
        },
      ],
    };
    planRepo.plans.push(plan);
    planProfileRepo.items.push({
      id: "pp1",
      planStartDate: new Date(),
      status: "PAID",
      saleItemId: "i1",
      dueDateDebt: 1,
      planId: plan.id,
      profileId: "p-c2",
      debts: [],
    });

    const result = await service.execute({ id: "sale-1", clientId: "c2" });

    const item = result.sale!.items[0];
    expect(item.discounts[0]).toEqual(
      expect.objectContaining({ origin: DiscountOrigin.PLAN }),
    );
    expect(item.price).toBe(90);
  });

  it("removes plan discounts when changing to client without plan", async () => {
    saleRepo.sales[0].items[0].price = 90;
    saleRepo.sales[0].items[0].discounts = [
      {
        amount: 10,
        type: DiscountType.VALUE,
        origin: DiscountOrigin.PLAN,
        order: 1,
      },
    ];

    const result = await service.execute({ id: "sale-1", clientId: "c2" });

    expect(result.sale!.items[0].discounts).toHaveLength(0);
    expect(result.sale!.items[0].price).toBe(90);
  });

  it("throws when no changes", async () => {
    await expect(
      service.execute({ id: "sale-1", clientId: "client-1" }),
    ).rejects.toThrow("No changes to the client");
  });
  it("throws when id is missing", async () => {
    await expect(service.execute({ id: "", clientId: "c2" })).rejects.toThrow(
      "Sale ID is required",
    );
  });

  it("throws when sale not found", async () => {
    await expect(
      service.execute({ id: "unknown", clientId: "c2" }),
    ).rejects.toThrow("Sale not found");
  });

  it("throws when sale is paid", async () => {
    saleRepo.sales[0].paymentStatus = "PAID";
    await expect(
      service.execute({ id: "sale-1", clientId: "c2" }),
    ).rejects.toThrow("Cannot edit a paid sale");
  });

  it("throws when profile not found", async () => {
    profileRepo.profiles = [];
    await expect(
      service.execute({ id: "sale-1", clientId: "c2" }),
    ).rejects.toThrow("Profile not found");
  });
});
