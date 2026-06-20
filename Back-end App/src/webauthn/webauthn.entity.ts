import { Entity, Property, ManyToOne, Rel } from '@mikro-orm/core'
import { BaseEntity } from '../shared/baseEntity.entity.js'
import { User } from '../user/user.entity.js'

@Entity()
export class Authenticator extends BaseEntity {
  @Property()
  credentialID!: string

  @Property()
  credentialPublicKey!: string

  @Property()
  counter!: number

  @Property()
  credentialDeviceType!: string

  @Property()
  credentialBackedUp!: boolean

  @Property({ type: 'array' })
  transports!: string[]

  @ManyToOne(() => User)
  user!: Rel<User>
}
