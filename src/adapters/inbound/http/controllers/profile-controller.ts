import { Service, Inject } from "typedi";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth-middleware.js";
import { HttpError } from "../errors/http-error.js";
import { EnsureMyProfileUseCase } from "../../../../application/profile/ensure-my-profile.use-case.js";
import { UpdateMyProfileUseCase } from "../../../../application/profile/update-my-profile.use-case.js";
import { AddRoleUseCase } from "../../../../application/profile/add-role.use-case.js";
import { UpdateRoleUseCase } from "../../../../application/profile/update-role.use-case.js";
import { DeleteRoleUseCase } from "../../../../application/profile/delete-role.use-case.js";

const updateProfileSchema = z.object({
  basics: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      name: z.string().optional(),
      location: z.string().optional(),
      linkedIn: z.string().optional(),
      github: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  preferences: z
    .object({
      lookingForWork: z.boolean().optional(),
      preferredRoles: z.array(z.string()).optional(),
      preferredLocations: z.array(z.string()).optional(),
      remoteOnly: z.boolean().optional(),
      salaryExpectation: z.string().optional(),
    })
    .optional(),
});

const addRoleSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()),
});

const updateRoleSchema = z.object({
  title: z.string().min(1).optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

@Service()
export class ProfileController {
  constructor(
    @Inject(() => EnsureMyProfileUseCase)
    private readonly ensureMyProfileUseCase: EnsureMyProfileUseCase,
    @Inject(() => UpdateMyProfileUseCase)
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    @Inject(() => AddRoleUseCase)
    private readonly addRoleUseCase: AddRoleUseCase,
    @Inject(() => UpdateRoleUseCase)
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    @Inject(() => DeleteRoleUseCase)
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
  ) {}

  async getMyProfile(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }

      // Ensure profile exists, create if needed
      const profile = await this.ensureMyProfileUseCase.execute(
        authRequest.user.id,
      );

      response.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }

      const input = updateProfileSchema.parse(request.body);

      const profile = await this.updateMyProfileUseCase.execute(
        authRequest.user.id,
        input,
      );

      response.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async addRole(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }

      const input = addRoleSchema.parse(request.body);

      const profile = await this.addRoleUseCase.execute(
        authRequest.user.id,
        input,
      );

      response.status(201).json(profile);
    } catch (error) {
      next(error);
    }
  }

  async updateRole(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }

      const roleId = request.params.roleId;
      const input = updateRoleSchema.parse(request.body);

      const profile = await this.updateRoleUseCase.execute(
        authRequest.user.id,
        roleId,
        input,
      );

      response.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      if (!authRequest.user) {
        throw new HttpError(401, "Unauthorized");
      }

      const roleId = request.params.roleId;

      const profile = await this.deleteRoleUseCase.execute(
        authRequest.user.id,
        roleId,
      );

      response.json(profile);
    } catch (error) {
      next(error);
    }
  }
}
