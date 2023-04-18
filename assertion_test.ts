import textV1 = require("./test_data/text.png");
import textV2 = require("./test_data/text_v2.png");
import textV3 = require("./test_data/text_v3.png");
import path = require("path");
import { asyncAssertScreenshot } from "./assertion";
import { assertReject, assertThat, eqError } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";
import "@selfage/puppeteer_test_executor_api";

async function setSampleImage(file: string): Promise<void> {
  let img = document.createElement("img");
  let loaded = new Promise<void>((resolve) => {
    img.onload = () => {
      resolve();
    };
  });
  img.src = file;
  await loaded;
  await puppeteerSetViewport(img.width, img.height);
  document.body.appendChild(img);
}

function removeImage(): void {
  if (document.body.firstElementChild) {
    document.body.firstElementChild.remove();
  }
}

async function forceDeleteFile(file: string): Promise<void> {
  try {
    await puppeteerDeleteFile(file);
  } catch (e) {
    // Ignore
  }
}

TEST_RUNNER.run({
  name: "NodeMatcherTest",
  environment: {
    setUp: () => {
      document.body.style.margin = "0";
      document.body.style.padding = "0";
    },
  },
  cases: [
    {
      name: "Identical",
      execute: async () => {
        // Prepare
        await setSampleImage(textV1);

        // Execute
        await asyncAssertScreenshot(
          path.join(__dirname, "identical.png"),
          textV1,
          path.join(__dirname, "identical_diff.png")
        );
      },
      tearDown: () => {
        removeImage();
      },
    },
    {
      name: "SameDimension",
      execute: async () => {
        // Prepare
        await setSampleImage(textV1);

        // Execute
        let error = await assertReject(
          asyncAssertScreenshot(
            path.join(__dirname, "same_dimension.png"),
            textV2,
            path.join(__dirname, "same_dimension_diff.png")
          )
        );

        // Verify
        assertThat(
          error,
          eqError(new Error("doesn't match expected")),
          "error"
        );
      },
      tearDown: async () => {
        removeImage();
        await Promise.all([
          forceDeleteFile(path.join(__dirname, "same_dimension.png")),
          forceDeleteFile(path.join(__dirname, "same_dimension_diff.png")),
        ]);
      },
    },
    {
      name: "DiffDimension",
      execute: async () => {
        // Prepare
        await setSampleImage(textV3);

        // Execute
        let error = await assertReject(
          asyncAssertScreenshot(
            path.join(__dirname, "/diff_dimension.png"),
            textV3,
            path.join(__dirname, "/diff_dimension_diff.png")
          )
        );

        // Verify
        assertThat(
          error,
          eqError(new Error("doesn't match expected")),
          "error"
        );
      },
      tearDown: async () => {
        removeImage();
        await Promise.all([
          forceDeleteFile(path.join(__dirname, "/diff_dimension.png")),
          forceDeleteFile(path.join(__dirname, "/diff_dimension_diff.png")),
        ]);
      },
    },
    {
      name: "SameAfterExcluded",
      execute: async () => {
        // Prepare
        await setSampleImage(textV2);

        // Execute
        await asyncAssertScreenshot(
          path.join(__dirname, "/same_after_excluded.png"),
          textV3,
          path.join(__dirname, "/same_after_excluded_diff.png"),
          {
            excludedAreas: [
              {
                x: 40,
                y: 140,
                width: 70,
                height: 50,
              },
              {
                x: 210,
                y: 20,
                width: 80,
                height: 60,
              },
            ],
          }
        );
      },
      tearDown: async () => {
        removeImage();
      },
    },
  ],
});
