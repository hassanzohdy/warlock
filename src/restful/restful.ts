import { log } from "@mongez/logger";
import { Model } from "@mongez/monpulse";
import { GenericObject } from "@mongez/reinforcements";
import { Request, Response } from "../http";
import { RepositoryManager } from "../repositories";
import { RestfulMiddleware, RouteResource } from "../router";

export abstract class Restful<T extends Model> implements RouteResource {
  /**
   * Middleware for each method
   */
  protected middleware: RestfulMiddleware = {};

  /**
   * Record name
   */
  protected recordName = "record";

  /**
   * Records list name
   */
  protected recordsListName = "records";

  /**
   * Repository
   */
  protected abstract repository: RepositoryManager<T>;

  /**
   * Define what to be returned when a record is created|updated|deleted|patched
   */
  protected returnOn: Record<string, "record" | "records"> = {
    create: "record",
    update: "record",
    delete: "record",
    patch: "record",
  };

  /**
   * Enable fetching cache
   *
   * @default true
   */
  public cache = true;

  /**
   * Find record instance by id
   */
  public async find(id: number) {
    const findMethod = this.cache ? "getCached" : "find";
    return this.repository[findMethod](id);
  }

  /**
   * List records
   */
  public async list(request: Request, response: Response) {
    try {
      if (await this.callMiddleware("list", request, response)) return;

      const responseDocument: GenericObject = {};

      const data = request.heavy();

      if (data.paginate === "false") {
        data.paginate = false;
      }

      const listMethod = this.cache ? "listCached" : "list";

      const { documents, paginationInfo } =
        await this.repository[listMethod](data);

      responseDocument[this.recordsListName] = documents;

      if (paginationInfo) {
        responseDocument.paginationInfo = paginationInfo;
      }

      return response.success(responseDocument);
    } catch (error: any) {
      log.error("restful", "list", error);
      return response.serverError(error);
    }
  }

  /**
   * Get single record
   */
  public async get(request: Request, response: Response) {
    try {
      if (await this.callMiddleware("get", request, response)) return;
      const record = await this.find(request.int("id"));

      if (!record) {
        return response.notFound();
      }

      return response.success({
        [this.recordName]: record,
      });
    } catch (error) {
      log.error("restful", "get", error);
    }
  }

  /**
   * Create record
   */
  public async create(request: Request, response: Response) {
    try {
      const model = this.repository.newModel();
      const beforeCreate = await this.beforeCreate(request, response, model);

      if (beforeCreate) {
        return beforeCreate;
      }

      const beforeSave = await this.beforeSave(request, response, model);

      if (beforeSave) {
        return beforeSave;
      }

      const record = await this.repository.create(request.all(), model);

      const createOutput = await this.onCreate(request, response, record);

      if (createOutput) {
        return createOutput;
      }

      const saveOutput = await this.onSave(request, response, record);

      if (saveOutput) {
        return saveOutput;
      }

      if (this.returnOn.create === "records") {
        return this.list(request, response);
      }

      return response.successCreate({
        [this.recordName]: record,
      });
    } catch (error: Error | any) {
      log.error("restful", "create", error);

      return response.badRequest({
        error: error.message,
      });
    }
  }

  /**
   * Update record
   */
  public async update(request: Request, response: Response) {
    try {
      // Find record
      const record = await this.repository.find(request.int("id"));

      if (!record) {
        return response.notFound({
          error: "Record not found",
        });
      }

      const beforeOutput = await this.beforeUpdate(request, response, record);
      if (beforeOutput) {
        return beforeOutput;
      }

      const beforeSafe = await this.beforeSave(request, response, record);

      if (beforeSafe) {
        return beforeSafe;
      }

      const oldRecord = record.clone();

      if (record.filled.length > 0) {
        await record.save(request.only(record.filled));
      } else {
        await record.save(request.allExceptParams());
      }

      this.onUpdate(request, response, record, oldRecord);
      this.onSave(request, response, record, oldRecord);

      if (this.returnOn.update === "records") {
        return this.list(request, response);
      }

      return response.success({
        [this.recordName]: record,
      });
    } catch (error) {
      log.error("restful", "update", error);
    }
  }

  /**
   * Patch record
   */
  public async patch(request: Request, response: Response) {
    try {
      const record = await this.repository.find(request.int("id"));

      if (!record) {
        return response.notFound({
          error: "Record not found",
        });
      }

      const oldRecord = record.clone();

      await this.beforePatch(request, response, record, oldRecord);
      await this.beforeSave(request, response, record, oldRecord);

      await record.save(request.heavyExceptParams());

      this.onPatch(request, response, record, oldRecord);
      this.onSave(request, response, record, oldRecord);

      if (this.returnOn.delete === "records") {
        return this.list(request, response);
      }

      return response.success({
        [this.recordName]: record,
      });
    } catch (error) {
      log.error("restful", "patch", error);
    }
  }

  /**
   * Delete record
   */
  public async delete(request: Request, response: Response) {
    try {
      const record = await this.repository.find(request.int("id"));

      if (!record) {
        return response.notFound();
      }

      await this.beforeDelete(request, response, record);

      await record.destroy();

      this.onDelete(request, response, record);

      if (this.returnOn.delete === "records") {
        return this.list(request, response);
      }

      return response.success();
    } catch (error) {
      log.error("restful", "delete", error);
    }
  }

  /**
   * Bulk delete records
   */
  public async bulkDelete(request: Request, response: Response) {
    const ids = request.input("id");

    if (!Array.isArray(ids)) {
      return response.badRequest({
        error: "id must be an array",
      });
    }

    const { documents: records } = await this.repository.list({
      paginate: false,
      perform: query =>
        query.whereIn(
          "id",
          ids.map(id => parseInt(id)),
        ),
    });

    for (const record of records) {
      await this.beforeDelete(request, response, record);
      record.destroy();
      this.onDelete(request, response, record);
    }

    if (this.returnOn.delete === "records") {
      return this.list(request, response);
    }

    return response.success({
      deleted: records.length,
    });
  }

  /**
   * Before create
   */
  protected async beforeCreate(
    _request: Request,
    _response: Response,
    _record: T,
  ): Promise<any> {
    //
  }

  /**
   * On create
   */
  protected async onCreate(
    _request: Request,
    _response: Response,
    _record: T,
  ): Promise<any> {
    //
  }

  /**
   * Before update
   */
  protected async beforeUpdate(
    _request: Request,
    _response: Response,
    _record: T,
    _oldRecord?: T,
  ): Promise<any> {
    //
  }

  /**
   * On update
   */
  protected async onUpdate(
    _request: Request,
    _response: Response,
    _record: T,
    _oldRecord: T,
  ): Promise<any> {
    //
  }

  /**
   * Before delete
   */
  protected async beforeDelete(
    _request: Request,
    _response: Response,
    _record: T,
  ): Promise<any> {
    //
  }

  /**
   * On delete
   */
  protected async onDelete(
    _request: Request,
    _response: Response,
    _record: T,
  ): Promise<any> {
    //
  }

  /**
   * Before patch
   */
  protected async beforePatch(
    _request: Request,
    _response: Response,
    _record: T,
    _oldRecord?: T,
  ): Promise<any> {
    //
  }

  /**
   * On patch
   */
  protected async onPatch(
    _request: Request,
    _response: Response,
    _record: T,
    _oldRecord: T,
  ): Promise<any> {
    //
  }

  /**
   * Before save
   */
  protected async beforeSave(
    _request: Request,
    _response: Response,
    _record?: T,
    _oldRecord?: T,
  ): Promise<any> {
    //
  }

  /**
   * On save
   */
  protected async onSave(
    _request: Request,
    _response: Response,
    _record: T,
    _oldRecord?: T,
  ): Promise<any> {
    //
  }

  /**
   * Call middleware for the given method
   *
   */
  protected async callMiddleware(
    method: string,
    request: Request,
    response: Response,
  ) {
    if (!this.middleware[method]) return;

    for (const middleware of this.middleware[method]) {
      const output = await middleware(request, response);

      if (output) {
        return output;
      }
    }

    return;
  }
}
