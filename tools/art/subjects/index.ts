import { Art, rgrad, type Paint } from "../raster";
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

/**
 * Pictures that are drawn inside a medallion / silhouette get a full-bleed background here,
 * so every picture is a complete rectangle of gems with no empty cells. Rectangular "card"
 * pictures already fill their whole canvas.
 */
const ring = (cx: number, cy: number, ramp: string[]): Paint => rgrad(cx, cy, 17, ramp);
const BACKDROPS: Record<string, Paint> = {
  heart: rgrad(8, 7.5, 12, ["#ffe9f0", "#ffdbe6", "#ffc8d9", "#ffb4cb"]),
  dog: ring(11, 12, ["#f6b878", "#f6b878", "#e8a05c", "#d08848"]),
  cat: ring(11, 12, ["#4679b0", "#4679b0", "#3b6aa0", "#305a8e"]),
  fox: ring(11, 12, ["#4c9448", "#4c9448", "#3f8340", "#337236"]),
  panda: ring(11, 12, ["#5aa84e", "#5aa84e", "#4a9443", "#3b8036"]),
  mandala: ring(12, 12, ["#2a1262", "#2a1262", "#1f0d4c", "#150838"]),
};

export function renderSubject(s: Subject): { rows: string[]; colors: Record<string, string> } {
  const a = new Art(s.w, s.h);
  s.draw(a);
  const bg = BACKDROPS[s.id];
  if (bg) a.backdrop(bg);
  a.fillHoles();
  return a.toRows();
}