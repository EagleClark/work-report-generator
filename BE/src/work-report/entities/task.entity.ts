import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project: string;

  @Column({ nullable: true })
  usDts: string;

  @Column({ nullable: true })
  usDtsLink: string;

  @Column('text')
  taskDetail: string;

  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'real', default: 0 })
  estimatedWorkload: number;

  @Column({ nullable: true })
  plannedStartDate: string;

  @Column({ nullable: true })
  plannedEndDate: string;

  @Column({ type: 'real', default: 0 })
  actualWorkload: number;

  @Column({ type: 'real', default: 0 })
  weeklyWorkload: number;

  @Column({ nullable: true })
  actualStartDate: string;

  @Column({ nullable: true })
  actualEndDate: string;

  @Column({ nullable: true })
  assignee: string;

  @Column({ nullable: true })
  remark: string;

  @Column()
  weekNumber: number;

  @Column()
  year: number;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, user => user.tasks)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
