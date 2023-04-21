import { log } from "@mongez/logger";
import { ChildModel, Model } from "@mongez/mongodb";
import { GenericObject } from "@mongez/reinforcements";
import { RestfulMiddleware, RouteResource } from "../router";
import { Request, Response } from "./..//http";
import { RepositoryManager } from "./../repositories";

export class Restful<T extends Model> implements RouteResource {
  /**
   * Base model
   */
  protected model?: ChildModel<T>;

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
  protected repository?: RepositoryManager<T>;

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
   * Find record instance by id
   */
  public async find(id: number) {
    return this.repository
      ? await this.repository.find(id)
      : await this.model?.find(id);
  }

  /**
   * List records
   */
  public async list(request: Request, response: Response) {
    try {
      // measure performance
      if (await this.callMiddleware("list", request, response)) return;

      const responseDocument: GenericObject = {};

      const data = request.heavy();

      if (data.paginate === "false") {
        data.paginate = false;
      }

      if (this.repository) {
        const { documents, paginationInfo } = await this.repository.list(data);

        responseDocument[this.recordsListName] = documents;

        if (paginationInfo) {
          responseDocument.paginationInfo = paginationInfo;
        }

        return response.success(responseDocument);
      } else {
        const query = (this.model as typeof Model).aggregate();

        const { orderBy = ["id", "DESC"] } = data;

        query.sort(orderBy[0], orderBy[1]);

        const { documents, paginationInfo } = await query.paginate(
          request.input("page", 1),
          request.input("limit", 15),
        );

        responseDocument[this.recordsListName] = documents;
        responseDocument.paginationInfo = paginationInfo;

        return response.success(responseDocument);
      }
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
      this.beforeCreate(request);
      this.beforeSave(request);
      const record = this.repository
        ? await this.repository.create(request.all())
        : ((await this.model?.create(request.all())) as T);

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
      const record = await this.find(request.int("id"));

      if (!record) {
        return response.notFound({
          error: "Record not found",
        });
      }

      this.beforeUpdate(request, record);
      this.beforeSave(request, record);

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
   * Delete record
   */
  public async delete(request: Request, response: Response) {
    if (String(request.input("id")).includes(",")) {
      return this.deleteMany(request, response);
    }

    try {
      const record = await this.find(request.int("id"));

      if (!record) {
        return response.notFound({
          error: "Record not found",
        });
      }

      this.beforeDelete(request, record);

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
   * Delete bulk records
   */
  public async deleteMany(request: Request, response: Response) {
    const ids = String(request.input("id"))
      .split(",")
      .map(id => parseInt(id));

    const records = await this.model?.aggregate().whereIn("id", ids).get();

    if (!records) {
      return response.notFound({
        error: "Record not found",
      });
    }

    for (const record of records) {
      this.beforeDelete(request, record);
      record.destroy();
      this.onDelete(request, record);
    }

    console.log(this.returnOn.delete);

    if (this.returnOn.delete === "records") {
      return this.list(request, response);
    }

    return response.success({
      [this.recordsListName]: records,
    });
  }

  /**
   * Patch record
   */
  public async patch(request: Request, response: Response) {
    try {
      const record = await this.model?.find(request.int("id"));

      if (!record) {
        return response.notFound({
          error: "Record not found",
        });
      }

      const oldRecord = record.clone();

      this.beforePatch(request, record, oldRecord);
      this.beforeSave(request, record, oldRecord);

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
