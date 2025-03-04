import { Field, ObjectType, Query, Resolver } from "type-graphql";
import type { EntityManager } from "typeorm";
import { Contribution, Contributor } from "./generated/model";

@ObjectType()
export class ReferralCodeCount {
  @Field(() => String, { nullable: false })
  referral_code!: string;
  @Field(() => Number, { nullable: false })
  referral_count!: number;

  constructor(referralCode: string, count: number) {
    this.referral_code = referralCode;
    this.referral_count = count;
  }
}

@ObjectType()
export class Metrics {
  @Field(() => Number, { nullable: false })
  totalContributions!: number;
  @Field(() => Number, { nullable: false })
  totalContributors!: number;
  @Field(() => String, { nullable: false })
  totalAmountContributed!: String;
  @Field(() => [ReferralCodeCount], { nullable: false })
  referralCodeCount!: ReferralCodeCount[];

  constructor(
    totalContributions: number,
    totalContributors: number,
    totalAmountContributed: string,
    referralCodeCount: ReferralCodeCount[]
  ) {
    this.totalContributions = totalContributions;
    this.totalContributors = totalContributors;
    this.totalAmountContributed = totalAmountContributed;
    this.referralCodeCount = referralCodeCount;
  }
}

@Resolver()
export class MetricsResolver {
  constructor(private db: () => Promise<EntityManager>) {}

  @Query(() => Metrics)
  async metrics(): Promise<Metrics> {
    const db = await this.db();
    let count = await db
      .getRepository(Contribution)
      .createQueryBuilder()
      .getCount();
    let indCount = await db
      .getRepository(Contributor)
      .createQueryBuilder()
      .getCount();
    let stringQuery = "SELECT SUM(balance) from contribution";
    let totalAmountContributed = await db
      .getRepository(Contribution)
      .query(stringQuery);
    let topReferrersStringQuery =
      "SELECT referral_code, COUNT(referral_code) as referral_count from contribution WHERE referral_code IS NOT NULL GROUP BY referral_code ORDER BY referral_count DESC";
    let topReferrersResult = await db
      .getRepository(Contribution)
      .query(topReferrersStringQuery);
  
    return new Metrics(
      count,
      indCount,
      totalAmountContributed[0].sum,
      topReferrersResult
    );
  }
}
