import { QuestionTypeDetector } from "../services/QuestionTypeDetector.js";
import { QuestionContentExtractor } from "../services/QuestionContentExtractor.js";
import { QuestionImageExtractor } from "../services/QuestionImageExtractor.js";
import { QuestionVisionParser } from "../services/QuestionVisionParser.js";
import QuestionSolver from "../services/questionsolver/index.js";
import QuestionAnswerService from "../services/QuestionAnswerService.js";

export class PersonalPracticeQuestionInspectTask {
  constructor(client, options = {}) {
    this.client = client;

    // ========================================================
    // SERVICES
    // ========================================================

    this.typeDetector =
      options.typeDetector ??
      new QuestionTypeDetector();

    this.contentExtractor =
      options.contentExtractor ??
      new QuestionContentExtractor();

    this.imageExtractor =
      options.imageExtractor ??
      new QuestionImageExtractor();

    this.visionParser =
      options.visionParser ??
      new QuestionVisionParser();

    this.solver =
      options.solver ??
      new QuestionSolver({
        visionParser:
          this.visionParser
      });

    this.answerService =
      options.answerService ??
      new QuestionAnswerService();
  }

  async execute(taskPayload = {}) {
    const page =
      this.client.getPage();

    if (!page) {
      throw new Error(
        "Sparx page is not available."
      );
    }

    // ==========================================================
    // AUTHENTICATION
    // ==========================================================

    const authenticated =
      await this.client.ensureAuthenticated();

    if (!authenticated) {
      throw new Error(
        "Sparx session is not authenticated."
      );
    }

    // ==========================================================
    // OPTIONAL SUPPLIED QUESTION URL
    // ==========================================================

    if (taskPayload.url) {
      console.log(
        "[Sparx] Using supplied question URL:"
      );

      console.log(
        taskPayload.url
      );

      await page.goto(
        taskPayload.url,
        {
          waitUntil:
            "domcontentloaded",
          timeout: 30000
        }
      );

      await page.waitForTimeout(
        1000
      );
    } else {
      // ========================================================
      // OPEN PERSONAL PRACTICE
      // ========================================================

      console.log(
        "[Sparx] Opening Personal Practice"
      );

      await page.goto(
        "https://maths.sparx-learning.com/student/personalpractice",
        {
          waitUntil:
            "domcontentloaded",
          timeout: 30000
        }
      );

      await page.waitForTimeout(
        1200
      );

      // ========================================================
      // START NEW PERSONAL PRACTICE
      // ========================================================

      const startButton =
        page
          .getByRole(
            "button",
            {
              name:
                /^start new$/i
            }
          )
          .first();

      if (
        await startButton.count() ===
        0
      ) {
        return {
          success: false,
          error:
            "Personal Practice 'Start new' button was not found.",
          url:
            page.url(),
          title:
            await page.title()
        };
      }

      await startButton.waitFor({
        state: "visible",
        timeout: 15000
      });

      console.log(
        "[Sparx] Starting new Personal Practice..."
      );

      await startButton
        .scrollIntoViewIfNeeded();

      await startButton.click();

      // ========================================================
      // WAIT FOR QUESTION URL
      // ========================================================

      console.log(
        "[Sparx] Waiting for question"
      );

      await page
        .waitForURL(
          /\/student\/package\/.*\/task\/.*\/item\/1/i,
          {
            timeout: 30000
          }
        )
        .catch(() => {});

      await page.waitForTimeout(
        1200
      );
    }

    const questionUrl =
      page.url();

    console.log(
      `[Sparx] Fresh question URL: ${questionUrl}`
    );

    // ==========================================================
    // QUESTION TEXT
    // ==========================================================

    const questionText =
      await page
        .locator("body")
        .innerText()
        .catch(
          () => ""
        );

    // ==========================================================
    // CLEAN QUESTION CONTENT
    // ==========================================================

    const content =
      this.contentExtractor.extract(
        questionText
      );

    // ==========================================================
    // DETECT QUESTION TYPE
    // ==========================================================

    let questionType =
      this.typeDetector.detect({
        questionText,
        content
      });

    // ==========================================================
    // EXTRACT QUESTION IMAGE
    // ==========================================================

    console.log(
      "[Sparx] Inspecting question"
    );

    let questionImages =
      [];

    try {
      questionImages =
        await this.imageExtractor.extract(
          page
        );
    } catch (error) {
      console.log(
        `[Sparx] Question image extraction failed: ${error.message}`
      );
    }

    // ==========================================================
    // VISION ANALYSIS
    // ==========================================================

    let visualAnalysis =
      null;

    const primaryImage =
      questionImages?.find(
        image =>
          image?.path
      );

    if (
      primaryImage?.path
    ) {
      try {
        // Support both parser APIs:
        //
        // 1. parse(...)
        // 2. analyzeImage(...)
        //
        // Your current QuestionVisionParser exposes
        // analyzeImage(), so this prevents the old
        // "parse is not a function" crash.

        let visionResult;

        if (
          typeof this
            .visionParser
            ?.parse ===
          "function"
        ) {
          visionResult =
            await this
              .visionParser
              .parse(
                primaryImage.path,
                {
                  questionType,
                  questionText:
                    content?.text ||
                    questionText ||
                    ""
                }
              );
        } else if (
          typeof this
            .visionParser
            ?.analyzeImage ===
          "function"
        ) {
          visionResult =
            await this
              .visionParser
              .analyzeImage(
                primaryImage.path,
                content?.text ||
                  questionText ||
                  ""
              );
        } else {
          throw new Error(
            "QuestionVisionParser has neither parse() nor analyzeImage()."
          );
        }

        // ======================================================
        // NORMALIZE VISION RESULT
        // ======================================================

        if (
          visionResult?.success
        ) {
          const visionData =
            visionResult.data ??
            visionResult.visualData ??
            null;

          visualAnalysis = {
            success: true,
            status:
              "vision-analysis-complete",
            imagePath:
              primaryImage.path,
            imageBytes:
              visionResult.imageBytes ??
              undefined,
            mimeType:
              visionResult.mimeType ??
              "image/png",
            model:
              visionResult.model ??
              null,
            keyIndex:
              visionResult.keyIndex ??
              null,
            questionType:
              visionData?.questionType ??
              null,
            visualData:
              visionData,
            error:
              null
          };

          // ==================================================
          // LET VISION IMPROVE THE QUESTION TYPE
          // ==================================================

          if (
            visionData
          ) {
            const visionType =
              visionData.answerModel ??
              visionData.questionType;

            if (
              visionType
            ) {
              questionType = {
                ...questionType,

                type:
                  visionType,

                confidence:
                  visionData.confidence ??
                  questionType.confidence,

                answerModel:
                  visionData.answerModel ??
                  questionType.answerModel
              };
            }
          }
        } else {
          visualAnalysis = {
            success: false,
            status:
              "vision-analysis-failed",
            imagePath:
              primaryImage.path,
            model:
              visionResult?.model ??
              null,
            keyIndex:
              visionResult?.keyIndex ??
              null,
            error:
              visionResult?.error ??
              "Gemini vision analysis failed.",
            visualData:
              null
          };

          console.log(
            `[Sparx] Vision analysis failed: ${
              visualAnalysis.error
            }`
          );
        }
      } catch (error) {
        visualAnalysis = {
          success: false,
          status:
            "vision-analysis-error",
          imagePath:
            primaryImage.path,
          error:
            error.message,
          visualData:
            null
        };

        console.log(
          `[Sparx] Vision analysis failed: ${error.message}`
        );
      }
    } else {
      visualAnalysis = {
        success: false,
        status:
          "no-question-image",
        imagePath:
          null,
        visualData:
          null
      };

      console.log(
        "[Sparx] No question image available for vision analysis."
      );
    }

    // ==========================================================
    // SOLVE QUESTION
    // ==========================================================

    let solution =
      null;

    try {
      solution =
        await this.solver.solve({
          questionType,
          content,
          questionText,
          questionImages,
          visualAnalysis
        });

      console.log(
        "[Solver] Solution generated:",
        solution
      );
    } catch (error) {
      solution = {
        success:
          false,
        method:
          "solver-error",
        answerModel:
          "unknown",
        answers:
          null,
        explanation:
          null,
        error:
          error.message
      };

      console.log(
        `[Solver] Failed: ${error.message}`
      );
    }

    // ==========================================================
    // ANSWER INTERFACE INSPECTION
    //
    // IMPORTANT:
    // This only opens/inspects the answer interface.
    // It does NOT enter or submit an answer.
    // ==========================================================

    let answerInterface =
      null;

    let answerPlan =
      null;

    try {
      answerInterface =
        await this.answerService.inspect(
          page
        );

      console.log(
        "[Answer] Interface inspected:",
        answerInterface
      );
    } catch (error) {
      answerInterface = {
        success:
          false,
        error:
          error.message
      };

      console.log(
        `[Answer] Interface inspection failed: ${error.message}`
      );
    }

    // ==========================================================
    // PREPARE ANSWER PLAN
    //
    // IMPORTANT:
    // Preparation only. No answer is entered or submitted here.
    // ==========================================================

    try {
      if (
        typeof this
          .answerService
          .prepare ===
        "function"
      ) {
        answerPlan =
          this.answerService.prepare(
            solution,
            answerInterface
          );
      } else {
        answerPlan = {
          success:
            false,
          method:
            "prepare-not-implemented",
          interfaceType:
            answerInterface
              ?.interfaceType ??
            "unknown",
          answers:
            null,
          actions:
            [],
          explanation:
            "QuestionAnswerService.prepare() is not implemented."
        };
      }

      console.log(
        "[Answer] Prepared answer plan:",
        answerPlan
      );

      let validation =
        null;

      if (
        typeof this
          .answerService
          .validatePreparedAnswer ===
        "function"
      ) {
        validation =
          this.answerService.validatePreparedAnswer(
            answerPlan,
            answerInterface
          );
      } else {
        validation = {
          valid:
            Boolean(
              answerPlan?.success
            ),
          reasons:
            []
        };
      }

      console.log(
        "[Answer] Answer plan validation:",
        validation
      );

      answerPlan = {
        ...answerPlan,
        validation
      };
    } catch (error) {
      answerPlan = {
        success:
          false,
        method:
          "answer-plan-error",
        interfaceType:
          answerInterface
            ?.interfaceType ??
          "unknown",
        answers:
          null,
        actions:
          [],
        explanation:
          null,
        error:
          error.message
      };

      console.log(
        `[Answer] Answer plan preparation failed: ${error.message}`
      );
    }

    // ==========================================================
    // INPUT INSPECTION
    // ==========================================================

    const inputs =
      await page
        .locator(
          "input:visible"
        )
        .evaluateAll(
          elements =>
            elements.map(
              (
                input,
                index
              ) => ({
                index,
                type:
                  input.type,
                name:
                  input.name,
                id:
                  input.id,
                placeholder:
                  input.placeholder,
                ariaLabel:
                  input.getAttribute(
                    "aria-label"
                  ),
                value:
                  input.value,
                readOnly:
                  input.readOnly,
                disabled:
                  input.disabled,
                inputMode:
                  input.getAttribute(
                    "inputmode"
                  ),
                dataRef:
                  input.getAttribute(
                    "data-ref"
                  )
              })
            )
        )
        .catch(
          () => []
        );

    // ==========================================================
    // BUTTON INSPECTION
    // ==========================================================

    const buttons =
      await page
        .locator(
          "button:visible"
        )
        .evaluateAll(
          elements =>
            elements.map(
              (
                button,
                index
              ) => ({
                index,
                text:
                  button.innerText
                    .trim(),
                type:
                  button.type,
                id:
                  button.id,
                ariaLabel:
                  button.getAttribute(
                    "aria-label"
                  ),
                disabled:
                  button.disabled
              })
            )
        )
        .catch(
          () => []
        );

    // ==========================================================
    // TEXTAREA INSPECTION
    // ==========================================================

    const textareas =
      await page
        .locator(
          "textarea:visible"
        )
        .evaluateAll(
          elements =>
            elements.map(
              (
                textarea,
                index
              ) => ({
                index,
                name:
                  textarea.name,
                id:
                  textarea.id,
                placeholder:
                  textarea.placeholder,
                value:
                  textarea.value
              })
            )
        )
        .catch(
          () => []
        );

    // ==========================================================
    // SELECT INSPECTION
    // ==========================================================

    const selects =
      await page
        .locator(
          "select:visible"
        )
        .evaluateAll(
          elements =>
            elements.map(
              (
                select,
                index
              ) => ({
                index,
                name:
                  select.name,
                id:
                  select.id,
                value:
                  select.value,
                options:
                  Array.from(
                    select.options
                  ).map(
                    option => ({
                      text:
                        option.text,
                      value:
                        option.value
                    })
                  )
              })
            )
        )
        .catch(
          () => []
        );

    // ==========================================================
    // IMAGE INSPECTION
    // ==========================================================

    const images =
      await page
        .locator(
          "img:visible"
        )
        .evaluateAll(
          elements =>
            elements.map(
              (
                img,
                index
              ) => ({
                index,
                alt:
                  img.alt,
                src:
                  img.src,
                width:
                  img.naturalWidth,
                height:
                  img.naturalHeight
              })
            )
        )
        .catch(
          () => []
        );

    // ==========================================================
    // LINK INSPECTION
    // ==========================================================

    const links =
      await page
        .locator(
          "a:visible"
        )
        .evaluateAll(
          elements =>
            elements.map(
              (
                a,
                index
              ) => ({
                index,
                text:
                  a.innerText
                    .trim(),
                href:
                  a.href
              })
            )
        )
        .catch(
          () => []
        );

    // ==========================================================
    // RESULT
    // ==========================================================

    return {
      success:
        true,

      questionUrl,

      questionType,

      content,

      solution,

      questionImages,

      visualAnalysis,

      answerInterface,

      answerPlan,

      questionText,

      inputs,

      textareas,

      selects,

      buttons,

      images,

      links
    };
  }
}

export default PersonalPracticeQuestionInspectTask;