import fs = require("fs");
import { eqScreenshot } from "./matcher";
import {
  assertReject,
  assertThat,
  asyncAssertThat,
  eqError,
} from "@selfage/test_matcher";
import { NODE_TEST_RUNNER } from "@selfage/test_runner";

NODE_TEST_RUNNER.run({
  name: "MatcherTest",
  cases: [
    {
      name: "Identical",
      execute: async () => {
        // Execute
        await asyncAssertThat(
          "./test_data/text.png",
          eqScreenshot(
            "./test_data/text.png",
            "./test_data/identical_diff.png"
          ),
          "same text png"
        );
      },
    },
    {
      name: "SameDimensionDiff",
      execute: async () => {
        // Execute
        let error = await assertReject(
          asyncAssertThat(
            "./test_data/text.png",
            eqScreenshot(
              "./test_data/text_v2.png",
              "./test_data/same_dimension_diff.png"
            ),
            "diff button png"
          )
        );

        // Verify
        assertThat(
          error,
          eqError(new Error("When matching diff button png")),
          "error"
        );

        // Cleanup
        await fs.promises.unlink("./test_data/same_dimension_diff.png");
      },
    },
    {
      name: "DiffDimension",
      execute: async () => {
        // Execute
        let error = await assertReject(
          asyncAssertThat(
            "./test_data/text_v2.png",
            eqScreenshot(
              "./test_data/text_v3.png",
              "./test_data/diff_dimension_diff.png"
            ),
            "diff button png"
          )
        );

        // Verify
        assertThat(
          error,
          eqError(new Error("When matching diff button png")),
          "error"
        );

        // Cleanup
        await fs.promises.unlink("./test_data/diff_dimension_diff.png");
      },
    },
    {
      name: "SameAfterExcludedDiff",
      execute: async () => {
        // Execute
        await asyncAssertThat(
          "./test_data/text_v2.png",
          eqScreenshot(
            "./test_data/text_v3.png",
            "./test_data/same_after_excluded_diff.png",
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
          ),
          "same button png"
        );
      },
    },
  ],
});
