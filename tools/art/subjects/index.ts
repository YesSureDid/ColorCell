import { Art } from "../raster";
import { heart } from "./heart";
import { dog } from "./dog";
import { cat } from "./cat";
import { sunflower, fox, icecream, rainbow } from "./batch1";
import { panda, cupcake, owl, butterfly, sailboat, goldfish } from "./batch2";
import { macaw, toadstool, rocket, penguin, balloon, lighthouse, whale } from "./batch3";
import { unicorn, pumpkin, snowman, beach, peacock, mandala } from "./batch4";

export interface Subject {
  id: string;
  name: string;
  w: number;
  h: number;
  draw: (a: Art) => void;
}

/** Level order. Index 0 is level 1. */
export const SUBJECTS: Subject[] = [heart, dog, cat, sunflower, fox, icecream, rainbow, panda, cupcake, owl, butterfly, sailboat, goldfish,
  macaw, toadstool, rocket, penguin, balloon, lighthouse, whale, unicorn, pumpkin, snowman, beach, peacock, mandala,
];

export function renderSubject(s: Subject): { rows: string[]; colors: Record<string, string> } {
  const a = new Art(s.w, s.h);
  s.draw(a);
  return a.toRows();
}
