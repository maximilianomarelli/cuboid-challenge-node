import { Id, RelationMappings } from 'objection';
import { Cuboid } from './Cuboid';
import Base from './Base';

export class Bag extends Base {
  id!: Id;
  volume!: number;
  title!: string;
  cuboids?: Cuboid[] | undefined;

  static tableName = 'bags';

  get payloadVolume(): number {
    // eslint-disable-next-line fp/no-let
    let payloadVolume = 0;
    if (this.cuboids) {
      for (const cuboid of this.cuboids) {
        payloadVolume += cuboid.volume;
      }
    }
    return payloadVolume;
  }

  get availableVolume(): number {
    return this.volume - this.payloadVolume;
  }

  static get virtualAttributes(): string[] {
    return ['availableVolume', 'payloadVolume'];
  }

  static get relationMappings(): RelationMappings {
    return {
      cuboids: {
        relation: Base.HasManyRelation,
        modelClass: Cuboid,
        join: {
          from: 'bags.id',
          to: 'cuboids.bagId',
        },
      },
    };
  }
}

export default Bag;
