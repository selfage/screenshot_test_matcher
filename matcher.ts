import fs = require("fs");
import pixelmatch = require("pixelmatch");
import stream = require("stream");
import util = require("util");
import { AsyncMatchFn } from "@selfage/test_matcher";
import { PNG } from "pngjs";
let pipeline = util.promisify(stream.pipeline);

export interface Rectangle {
  x: number;
  y: number;
  height: number;
  width: number;
}

export interface Options {
  // Range from 0 to 1. Smaller values make the comparison more sensitive.
  threshold?: number;
  excludedAreas?: Array<Rectangle>;
}

export function eqScreenshot(
  expected: string,
  diff: string,
  options: Options = {
    threshold: 0.1,
    excludedAreas: [],
  }
): AsyncMatchFn<string> {
  return async (actual) => {
    let [expectedPng, actualPng] = await Promise.all([
      readPng(expected),
      readPng(actual),
    ]);
    for (let excludedArea of options.excludedAreas) {
      clearArea(expectedPng, excludedArea);
      clearArea(actualPng, excludedArea);
    }

    let maxWidth = Math.max(expectedPng.width, actualPng.width);
    let maxHeight = Math.max(expectedPng.height, actualPng.height);
    expectedPng = tryEnlarge(expectedPng, maxWidth, maxHeight);
    actualPng = tryEnlarge(actualPng, maxWidth, maxHeight);
    let diffPng = new PNG({ width: maxWidth, height: maxHeight, colorType: 6 });
    let numOfDiff = pixelmatch(
      actualPng.data,
      expectedPng.data,
      diffPng.data,
      maxWidth,
      maxHeight,
      { threshold: options.threshold }
    );
    if (numOfDiff !== 0) {
      await pipeline(diffPng.pack(), fs.createWriteStream(diff));
      throw new Error(`Actual ${actual} doesn't match expected ${expected}.`);
    }
  };
}

async function readPng(file: string): Promise<PNG> {
  let png = new PNG();
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(png)
      .on("error", function (e) {
        reject(e);
      })
      .on("parsed", function () {
        resolve();
      });
  });
  return png;
}

function clearArea(png: PNG, area: Rectangle): void {
  for (let i = area.y; i < i + area.height && i < png.height; i++) {
    let startX = Math.min(png.width, area.x);
    let endX = Math.min(png.width, area.x + area.width);
    png.data.fill(0, (i * png.width + startX) * 4, (i * png.width + endX) * 4);
  }
}

function tryEnlarge(
  originalPng: PNG,
  newWidth: number,
  newHeight: number
): PNG {
  if (originalPng.width >= newWidth && originalPng.height >= newHeight) {
    return originalPng;
  }

  let newPng = new PNG({ width: newWidth, height: newHeight });
  originalPng.bitblt(newPng, 0, 0, originalPng.width, originalPng.height, 0, 0);
  return newPng;
}
