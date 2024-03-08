import { Prisma, course } from "@prisma/client";
import { CoursesRepository } from "../course-repository";
import crypto from "node:crypto";

export class InMemoryCoursesRepository implements CoursesRepository {
  public items: course[] = [];

  async create(data: Prisma.courseCreateInput) {
    const course = {
      id: crypto.randomUUID(),
      name: data.name,
      active: data.active,
    };
    this.items.push(course);

    return course;
  }
}
