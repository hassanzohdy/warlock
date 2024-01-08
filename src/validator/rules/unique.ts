import { Aggregate, Model } from "@mongez/monpulse";
import { Request } from "../../http";
import { pool } from "../../pool";
import { Rule } from "./rule";

export class UniqueRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "unique";

  /**
   * Table name
   */
  protected tableName?: string;

  /**
   * Except column
   */
  protected exceptColumn = "id";

  /**
   * Except value
   */
  protected exceptValue: any = null;

  /**
   * Is case sensitive
   */
  protected isCaseSensitive = true;

  /**
   * Model
   */
  protected model?: typeof Model;

  /**
   * Filter without current user value
   */
  protected exceptUserId = false;

  /**
   * Add custom query
   */
  protected _query?: (query: Aggregate, request: Request<any>) => void;

  /**
   * Constructor
   */
  public constructor(
    tableName: string | typeof Model,
    protected columnName?: string,
  ) {
    //
    super();
    if (typeof tableName === "string") {
      this.tableName = tableName;
    } else {
      this.model = tableName;
    }
  }

  /**
   * Run the rule except for current user
   */
  public exceptCurrentUser(exceptCurrentUser = true) {
    this.exceptUserId = exceptCurrentUser;
    return this;
  }

  /**
   * Except value
   */
  public except(column: string, value?: any) {
    this.exceptColumn = column;
    this.exceptValue = value;

    return this;
  }

  /**
   * Ignore case sensitive
   */
  public insensitive() {
    this.isCaseSensitive = false;
    return this;
  }

  /**
   * Strict to be sensitive
   */
  public sensitive() {
    this.isCaseSensitive = true;
    return this;
  }

  /**
   * Validate the rule
   */
  public async validate() {
    if (this.exceptUserId) {
      const user = this.request.user;

      if (user) {
        this.exceptValue = user.id;
        this.exceptColumn = "id";
      }
    }

    if (this.exceptColumn && !this.exceptValue) {
      this.exceptValue = this.request.input(this.exceptColumn);
    }

    const column = this.columnName || this.input;

    const value = this.isCaseSensitive
      ? String(this.value || "").toLowerCase()
      : this.value;

    if (this.model) {
      const models = pool().list(this.model);
      const potentialModel = models.find(model => {
        const columnValue = model.get(column);
        if (this.exceptValue) {
          return (
            columnValue === value &&
            model.get(this.exceptColumn) !== this.exceptValue
          );
        }

        return columnValue === value;
      });

      if (potentialModel) {
        this.isValid = false;
        return;
      }
    }

    let query: Aggregate;
    if (this.model) {
      query = (this.model as any).aggregate();
    } else {
      query = new Aggregate(this.tableName as string);
    }

    if (Array.isArray(value)) {
      query.whereIn(column, value);
    } else {
      query.where(column, value);
    }

    if (this.exceptValue) {
      query.where(this.exceptColumn, "!=", this.exceptValue);
    }

    if (this._query) {
      this._query(query, this.request);
    }

    const document = await query.first();

    if (document && this.model) {
      pool().add({
        model: document,
      });
    }

    this.isValid = !document;
  }

  /**
   * Add custom query
   */
  public query(query: (query: Aggregate, request: Request<any>) => void) {
    this._query = query;
    return this;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("unique");
  }
}
