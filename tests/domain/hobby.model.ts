import { Changeset, Field } from "../../src";

export class Hobby {
  @Field({ primary: true })
  public id!: string;
  @Field()
  public name = "";
  @Field()
  public since: Date = new Date();

  changeset(changeset: Changeset<Hobby>, params: Partial<Hobby>): Changeset<Hobby> {
    return changeset
      .cast(params, ["name", "since"])
      .validateRequired(["name", "since"])
      .validateLength("name", { min: 3, max: 255, message: "Name must be between 3 and 255 characters" })
      .validateChange("since", (since: Date, _old: Date) => since < new Date(), {}, {
        message: "Since must be in the past",
        validator: "past_date",
      });
  }
}
