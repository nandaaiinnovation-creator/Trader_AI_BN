import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'signals' })
export class Signal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  symbol!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  rule!: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  signal!: string | null;

  @Column({ type: 'numeric', nullable: true })
  score!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  data!: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

export default Signal;
