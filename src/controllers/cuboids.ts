import { Request, Response } from 'express';
import * as HttpStatus from 'http-status-codes';
import { Id } from 'objection';
import { Bag, Cuboid } from '../models';

export const list = async (req: Request, res: Response): Promise<Response> => {
  const ids = req.query.ids as Id[];
  const cuboids = await Cuboid.query().findByIds(ids).withGraphFetched('bag');

  return res.status(200).json(cuboids);
};

export const get = async (req: Request, res: Response): Promise<Response> => {
  const id = req.params.id as Id;
  const cuboid = await Cuboid.query().findById(id).withGraphFetched('bag');

  if (!cuboid) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }

  return res.status(200).json(cuboid);
};

export const create = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { width, height, depth, bagId } = req.body;
  const newVolume = width * height * depth;
  const bag = await Bag.query()
    .findById(bagId || '0')
    .withGraphFetched('cuboids');

  if (!bag) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }
  if (newVolume > bag.availableVolume) {
    return res
      .status(HttpStatus.UNPROCESSABLE_ENTITY)
      .json({ message: 'Insufficient capacity in bag' });
  }

  const cuboid = await Cuboid.query().insert({
    width,
    height,
    depth,
    bagId,
  });

  return res.status(HttpStatus.CREATED).json(cuboid);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const cuboid = await Cuboid.query().findById(req.params.id);

  if (!cuboid) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }

  const { width, height, depth } = req.body;
  const newVolume = width * height * depth;
  const bag = await Bag.query()
    .findById(cuboid.bagId || '0')
    .withGraphFetched('cuboids');

  if (!bag) {
    return res
      .status(HttpStatus.UNPROCESSABLE_ENTITY)
      .json({ message: 'Bag is invalid' });
  }
  if (newVolume - cuboid.volume > bag.availableVolume) {
    return res
      .status(HttpStatus.UNPROCESSABLE_ENTITY)
      .json({ message: 'Insufficient capacity in bag' });
  }

  cuboid.width = width;
  cuboid.height = height;
  cuboid.depth = depth;

  await Cuboid.query().findById(cuboid.id).update(cuboid);

  const updatedCuboid = await Cuboid.query()
    .findById(cuboid.id)
    .withGraphFetched('bag');

  return res.status(HttpStatus.OK).json(updatedCuboid);
};

export const destroy = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const cuboid = await Cuboid.query().findById(req.params.id);

  if (!cuboid) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }

  await Cuboid.query().findById(req.params.id).update(cuboid);

  return res.sendStatus(HttpStatus.OK);
};
