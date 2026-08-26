import fs from "node:fs/promises";
import path from "node:path";

export class QuestionImageExtractor {
  async extract(page, images = []) {
    const results = [];

    const visibleImages =
      page.locator("img:visible");

    const count =
      await visibleImages.count();

    for (let i = 0; i < count; i++) {
      const element =
        visibleImages.nth(i);

      const src =
        await element.getAttribute("src");

      const alt =
        await element.getAttribute("alt");

      const box =
        await element.boundingBox();

      if (!box) {
        continue;
      }

      const width =
        Math.round(box.width);

      const height =
        Math.round(box.height);

      const normalizedSrc =
        (src || "").toLowerCase();

      const isLogo =
        normalizedSrc.includes(
          "sparx_maths_logo"
        );

      const isInlineSvg =
        normalizedSrc.startsWith(
          "data:image/svg+xml"
        );

      // Ignore navigation/UI images.
      if (
        isLogo ||
        isInlineSvg ||
        width < 300 ||
        height < 200
      ) {
        continue;
      }

      try {
        const buffer =
          await element.screenshot({
            type: "png"
          });

        const outputDirectory =
          path.resolve(
            "packages",
            "adapters",
            "sparx",
            "artifacts",
            "questions"
          );

        await fs.mkdir(
          outputDirectory,
          {
            recursive: true
          }
        );

        const filename =
          `question-${Date.now()}-${i + 1}.png`;

        const outputPath =
          path.join(
            outputDirectory,
            filename
          );

        await fs.writeFile(
          outputPath,
          buffer
        );

        results.push({
          index: i,
          src,
          alt,
          width,
          height,
          path: outputPath
        });

        console.log(
          `[Sparx] Question image saved: ${outputPath}`
        );
      } catch (error) {
        console.log(
          `[Sparx] Failed to capture image ${i}:`,
          error.message
        );
      }
    }

    return results;
  }
}

export default QuestionImageExtractor;