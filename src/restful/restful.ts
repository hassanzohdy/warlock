import { log } from "@mongez/logger";
import { Model } from "@mongez/mongodb";
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
      const { documents, paginationInfo } = await this.repository[listMethod](
        data,
      );

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
      const record = await this.find(request.int("id"));

      if (!record) {
        return response.notFound({
          error: "Record not found",
        });
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
      await this.beforeCreate(request);
      await this.beforeSave(request);

      const record = await this.repository.create(request.all());

      this.onCreate(request, record);
      this.onSave(request, record);

      if (this.returnOn.create === "records") {
        return this.list(request, response);
      }

      return response.success({
        [this.recordName]: record,
      });
    } catch (error) {
      log.error("restful", "create", error);
    }
  }

  /**
   * Update record
   */
  public async update(request: Request, response: Response) {
    try {
      const record = await this.repository.find(request.int("id"));

      if (!record) {
        return response.notFound({
          error: "Record not found",
        });
      }

      await this.beforeUpdate(request, record);
      await this.beforeSave(request, record);

      const oldRecord = record.clone();

      if (record.filled.length > 0) {
        await record.save(request.only(record.filled));
      } else {
        await record.save(request.allExceptParams());
      }

      this.onUpdate(request, record, oldRecord);
      this.onSave(request, record, oldRecord);

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
      await this.beforeDelete(request, record);
      record.destroy();
      this.onDelete(request, record);
    }

    if (this.returnOn.delete === "records") {
      return this.list(request, response);
    }

    return response.success({
      [this.recordsListName]: records,
    });
  }

  /**
   * Delete record
   */
  public async delete(request: Request, response: Response) {
    try {
      const record = await this.repository.find(request.int("id"));

      if (!record) {
        return response.notFound({
          error: "Record not found",
        });
      }

      await this.beforeDelete(request, record);

      await record.destroy();

      this.onDelete(request, record);

      if (this.returnOn.delete === "records") {
        return this.list(request, response);
      }

      return response.success({
        [this.recordName]: record,
      });
    } catch (error) {
      log.error("restful", "delete", error);
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

      await this.beforePatch(request, record, oldRecord);
      await this.beforeSave(request, record, oldRecord);

      await record.save(request.all());

      this.onPatch(request, record, oldRecord);
      this.onSave(request, record, oldRecord);

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
   * Before create
   */
  protected beforeCreate(_request: Request) {
    //
  }

  /**
   * On create
   */
  protected onCreate(_request: Request, _record: T) {
    //
  }

  /**
   * Before update
   */
  protected beforeUpdate(_request: Request, _record: T, _oldRecord?: T) {
    //
  }

  /**
   * On update
   */
  protected onUpdate(_request: Request, _record: T, _oldRecord: T) {
    //
  }

  /**
   * Before delete
   */
  protected beforeDelete(_request: Request, _record: T) {
    //
  }

  /**
   * On delete
   */
  protected onDelete(_request: Request, _record: T) {
    //
  }

  /**
   * Before patch
   */
  protected beforePatch(_request: Request, _record: T, _oldRecord?: T) {
    //
  }

  /**
   * On patch
   */
  protected onPatch(_request: Request, _record: T, _oldRecord: T) {
    //
  }

  /**
   * Before save
   */
  protected beforeSave(_request: Request, _record?: T, _oldRecord?: T) {
    //
  }

  /**
   * On save
   */
  protected onSave(_request: Request, _record: T, _oldRecord?: T) {
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
