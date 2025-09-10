import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, BaseEntity } from 'typeorm';

@Entity('candles')
export class Candle extends BaseEntity {
  @PrimaryColumn()
  symbol!: string;
  @PrimaryColumn()
  timeframe!: string;
  @PrimaryColumn({ type: 'timestamptz' })
  ts!: Date;
  @Column('numeric')
  open!: number;
  @Column('numeric')
  high!: number;
  @Column('numeric')
  low!: number;
  @Column('numeric')
  close!: number;
  @Column('numeric')
  volume!: number;
  @Column('numeric', { nullable: true })
  vwap?: number;
  @Column('numeric', { nullable: true })
  oi?: number;
}

@Entity('signals')
export class Signal extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column('timestamptz')
  ts!: Date;
  @Column()
  symbol!: string;
  @Column()
  side!: 'BUY' | 'SELL';
  @Column('numeric')
  score!: number;
  @Column()
  regime!: string;
  @Column('jsonb')
  rules_fired!: object;
  @Column()
  reason!: string;
}

@Entity('settings')
export class Settings extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column('jsonb')
  encrypted_secrets!: any;
  @Column('jsonb')
  rule_config!: any;
  @Column('timestamptz', { default: () => 'now()' })
  created_at!: Date;
  @Column('timestamptz', { default: () => 'now()' })
  updated_at!: Date;
}

@Entity('sentiment_daily')
export class SentimentDaily extends BaseEntity {
  @PrimaryColumn({ type: 'date' })
  date!: string;
  @PrimaryColumn()
  symbol!: string;
  @PrimaryColumn()
  provider!: string;
  @Column('numeric')
  score!: number;
  @Column('jsonb')
  articles!: object;
}

@Entity('snapshots')
export class Snapshot extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column('timestamptz')
  ts!: Date;
  @Column()
  symbol!: string;
  @Column('jsonb')
  payload!: object;
}
