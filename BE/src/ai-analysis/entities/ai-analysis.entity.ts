import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('ai_analyses')
@Index(['year', 'weekNumber'], { unique: true })
export class AIAnalysis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column()
  weekNumber: number;

  @Column('text')
  analysisContent: string;

  @Column('text', { nullable: true })
  userPrompt?: string;

  @Column({ default: 'OPENAI' })
  modelType: string;

  @Column({ nullable: true })
  modelName?: string;

  @Column('json', { nullable: true })
  metadata?: {
    tokenCount?: number;
    generationTime?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}