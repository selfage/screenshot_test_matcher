import pixelmatch = require("pixelmatch");
import "@selfage/puppeteer_test_executor_api";

export interface Rectangle {
  x: number;
  y: number;
  height: number;
  width: number;
}

export async function asyncAssertScreenshot(
  actualFile: string,
  expectedFile: string,
  diffFile: string,
  {
    delay = 500,
    fullPage,
    quality,
    threshold = 0.1,
    excludedAreas = [],
  }: {
    // ms
    delay?: number;
    fullPage?: boolean;
    // The quality of the image, between 0-100. Not applicable to png images.
    quality?: number;
    // Range from 0 to 1. Smaller values make the comparison more sensitive.
    threshold?: number;
    excludedAreas?: Array<Rectangle>;
  } = {}
): Promise<void> {
  await screenshot(actualFile, { delay, fullPage, quality });

  let [expectedImg, actualImg] = await Promise.all([
    loadImage(expectedFile),
    loadImage(actualFile),
  ]);
  let maxWidth = Math.max(expectedImg.width, actualImg.width);
  let maxHeight = Math.max(expectedImg.height, actualImg.height);
  let expectedImgData = getImageData(expectedImg, maxWidth, maxHeight);
  let actualImgData = getImageData(actualImg, maxWidth, maxHeight);

  for (let excludedArea of excludedAreas) {
    clearArea(expectedImgData, excludedArea);
    clearArea(actualImgData, excludedArea);
  }

  let diffCanvas = document.createElement("canvas");
  diffCanvas.width = maxWidth;
  diffCanvas.height = maxHeight;
  let diffContext = diffCanvas.getContext("2d");
  let diffImg = diffContext.createImageData(maxWidth, maxHeight);
  let numOfDiff = pixelmatch(
    actualImgData.data,
    expectedImgData.data,
    diffImg.data,
    maxWidth,
    maxHeight,
    { threshold }
  );
  if (numOfDiff !== 0) {
    diffContext.putImageData(diffImg, 0, 0);
    let diffImgFileData = await new Promise<string>((resolve, reject) => {
      diffCanvas.toBlob((blob) => {
        let reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(reader.error);
        };
        reader.onabort = () => {
          reject(new Error("Reading diff image from canvas aborted."));
        };
        reader.readAsBinaryString(blob);
      });
    });
    await writeFile(diffFile, diffImgFileData);
    throw new Error(
      `Actual screenshot "${actualFile}" doesn't match expected ` +
        `"${expectedFile}".`
    );
  } else {
    try {
      await Promise.all([deleteFile(actualFile), await deleteFile(diffFile)]);
    } catch (e) {
      // Ignore file-not-exists error.
    }
  }
}

async function loadImage(path: string): Promise<HTMLImageElement> {
  let img = new Image();
  let loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => {
      resolve();
    };
  });
  img.src = path;
  await loaded;
  return img;
}

function getImageData(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): ImageData {
  let canvas = document.createElement("canvas");
  canvas.width = maxWidth;
  canvas.height = maxHeight;
  let context = canvas.getContext("2d");
  context.drawImage(img, 0, 0);
  return context.getImageData(0, 0, maxWidth, maxHeight);
}

function clearArea(img: ImageData, area: Rectangle): void {
  for (let i = area.y; i < i + area.height && i < img.height; i++) {
    let startX = Math.min(img.width, area.x);
    let endX = Math.min(img.width, area.x + area.width);
    img.data.fill(0, (i * img.width + startX) * 4, (i * img.width + endX) * 4);
  }
}
