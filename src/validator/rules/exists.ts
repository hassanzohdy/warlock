import { Aggregate } from "@mongez/monpulse";
import { isNumeric } from "@mongez/supportive-is";
import { UniqueRule } from "./unique";

export class ExistsRule extends UniqueRule {
  /**
   * Rule name
   */
  public static ruleName = "exists";

  /**
   * Is case sensitive
   */
  protected isCaseSensitive = false;

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
      ? String(this.value).toLowerCase()
      : isNumeric(this.value)
      ? Number(this.value)
      : this.value;

    query.where(this.columnName || this.input, value);

    if (this.exceptValue) {
      query.where(this.exceptColumn, "!=", this.exceptValue);
    }

    this.isValid = (await query.count()) > 0;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("exists");
  }
}
