import { Aggregate } from "@mongez/monpulse";
import { isNumeric } from "@mongez/supportive-is";
import { pool } from "../../pool";
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

    if (!this.columnName) {
      this.columnName = "id";
    }

    let query: Aggregate;

    if (this.model) {
      const modelsList = pool().list(this.model);

      const potentialModel = modelsList.find(model => {
        const value = model.get(this.columnName as string);
        if (this.exceptValue) {
          return (
            value === this.value &&
            model.get(this.exceptColumn) !== this.exceptValue
          );
        }

        return value === this.value;
      });

      if (potentialModel) {
        this.isValid = true;
        return;
      }
    }

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

    const column = this.columnName || this.input;

    query.where(column, value);

    if (this.exceptValue) {
      query.where(this.exceptColumn, "!=", this.exceptValue);
    }

    const document = await query.first();

    if (document && this.model) {
      pool().add({
        model: document,
      });
    }

    this.isValid = Boolean(document);
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("exists");
  }
}
