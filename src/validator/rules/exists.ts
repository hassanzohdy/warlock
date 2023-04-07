import { Aggregate } from "@mongez/mongodb";
import { UniqueRule } from "./unique";

export class ExistsRule extends UniqueRule {
  /**
   * Rule name
   */
  public static ruleName = "exists";

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

    const value = this.isCaseSensitive ? this.value : this.value.toLowerCase();

    query.where(this.columnName || this.input, value);

    if (this.exceptValue) {
      const exceptValue = this.isCaseSensitive
        ? this.exceptValue
        : this.exceptValue.toLowerCase();
      query.where(this.exceptColumn, "!=", exceptValue);
    }

    this.isValid = (await query.count()) > 0;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("unique");
  }
}
