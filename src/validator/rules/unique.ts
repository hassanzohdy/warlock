import { Aggregate, Model } from "@mongez/mongodb";
import { getCurrentUser } from "../../auth";
import Rule from "./rule";

export default class UniqueRule extends Rule {
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
  public exceptCurrentUser() {
    const user = getCurrentUser();

    if (!user || user.userType !== "user") return this;

    this.exceptValue = user.id;
    this.exceptColumn = "id";

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
   * Except value
   */
  public except(column: string, value?: any) {
    this.exceptColumn = column;
    this.exceptValue = value;

    return this;
  }

  /**
   * Validate the rule
   */
  public async validate() {
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
      ? this.value
      : (this.value || "").toLowerCase();

    query.where(this.columnName || this.input, value);

    if (this.exceptValue) {
      const exceptValue = this.isCaseSensitive
        ? this.exceptValue
        : this.exceptValue.toLowerCase();
      query.where(this.exceptColumn, "!=", exceptValue);
    }

    this.isValid = (await query.count()) === 0;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("unique");
  }
}
