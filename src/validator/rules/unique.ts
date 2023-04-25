import { Aggregate, Model } from "@mongez/mongodb";
import Is from "@mongez/supportive-is";
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
  protected _query?: (query: Aggregate) => void;

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

    let query: Aggregate;

    if (this.model) {
      query = (this.model as any).aggregate();
    } else {
      query = new Aggregate(this.tableName as string);
    }

    const value = this.isCaseSensitive
      ? Is.string(this.value)
        ? (this.value || "").toLowerCase()
        : this.value
      : this.value;

    if (Array.isArray(value)) {
      query.whereIn(this.columnName || this.input, value);
    } else {
      query.where(this.columnName || this.input, value);
    }

    if (this.exceptValue) {
      query.where(this.exceptColumn, "!=", this.exceptValue);
    }

    if (this._query) {
      this._query(query);
    }

    this.isValid = (await query.count()) === 0;
  }

  /**
   * Add custom query
   */
  public query(query: (query: Aggregate) => void) {
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
