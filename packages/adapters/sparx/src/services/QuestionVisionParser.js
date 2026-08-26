import fs from "node:fs/promises";

export class QuestionVisionParser {
  constructor(options = {}) {
    this.apiKeys = (
      options.apiKeys ??
      process.env.GEMINI_API_KEYS ??
      ""
    )
      .split(",")
      .map(key => key.trim())
      .filter(Boolean);

    this.primaryModel =
      options.primaryModel ??
      process.env.GEMINI_VISION_MODEL ??
      "gemini-3.6-flash";

    this.fallbackModel =
      options.fallbackModel ??
      process.env.GEMINI_VISION_FALLBACK_MODEL ??
      "gemini-3.5-flash-lite";

    this.apiBase =
      "https://generativelanguage.googleapis.com/v1beta/models";

    this.keyIndex = 0;

    if (this.apiKeys.length === 0) {
      console.warn(
        "[Gemini] No Gemini API keys configured."
      );
    }
  }

  // ==========================================================
  // PUBLIC PARSE METHOD
  // ==========================================================

  async parse(imagePath, options = {}) {
    if (!imagePath) {
      return {
        success: false,
        status: "missing-image",
        imagePath: null,
        visualData: null,
        error:
          "No image path was provided."
      };
    }

    const questionText =
      options.questionText ?? "";

    const questionType =
      options.questionType ?? {
        type: "unknown",
        confidence: 0,
        answerModel: "unknown"
      };

    try {
      const result =
        await this.analyzeImage(
          imagePath,
          questionText,
          questionType
        );

      if (!result.success) {
        return {
          success: false,
          status:
            "vision-analysis-failed",
          imagePath,
          model:
            result.model ?? null,
          keyIndex:
            result.keyIndex ?? null,
          error:
            result.error ??
            "Gemini vision analysis failed.",
          visualData: null
        };
      }

      const visualData =
        this.normalizeVisualData(
          result.data
        );

      return {
        success: true,
        status:
          "vision-analysis-complete",
        imagePath,
        imageBytes:
          result.imageBytes ?? null,
        mimeType:
          result.mimeType ??
          this.detectMimeType(imagePath),
        model:
          result.model,
        keyIndex:
          result.keyIndex,

        questionType: {
          type:
            visualData.questionType ??
            questionType?.type ??
            "unknown",

          confidence:
            Number(
              visualData.confidence ??
              questionType?.confidence ??
              0
            ),

          answerModel:
            visualData.answerModel ??
            questionType?.answerModel ??
            "unknown"
        },

        visualData
      };
    } catch (error) {
      return {
        success: false,
        status:
          "vision-analysis-error",
        imagePath,
        visualData: null,
        error:
          error?.message ??
          String(error)
      };
    }
  }

  // ==========================================================
  // IMAGE ANALYSIS
  // ==========================================================

  async analyzeImage(
    imagePath,
    questionText = "",
    questionType = {}
  ) {
    const imageBytes =
      await fs.readFile(
        imagePath
      );

    const base64Image =
      imageBytes.toString(
        "base64"
      );

    const mimeType =
      this.detectMimeType(
        imagePath
      );

    const prompt = `
You are the mathematical vision engine for a Sparx Maths solver.

Your job is NOT merely to describe the image.

Your job is to convert the visible Sparx question into a precise,
machine-readable mathematical problem that a deterministic solver can solve.

The question can belong to ANY of these areas:

arithmetic
algebra
equations
inequalities
fractions
decimals
percentages
ratio
proportion
rates
unit conversions
rounding
sequences
patterns
coordinates
graphs
tables
statistics
probability
geometry
angles
transformations
symmetry
measurements
area
perimeter
volume
surface area
trigonometry
gradient
intercepts
simultaneous equations
factorising
expanding
simplifying
substitution
indices
standard form
bounds
estimation
compound measures
time
money
scale
bearings
vectors
frequency tables
cumulative frequency
averages
histograms
scatter graphs
box plots
line graphs

The image may contain:

- equations
- expressions
- fractions
- diagrams
- coordinate grids
- graph axes
- plotted points
- lines
- tables
- timetables
- scatter graphs
- histograms
- box plots
- frequency tables
- probability diagrams
- geometric shapes
- angle markings
- transformation diagrams
- vector diagrams
- multiple-choice options
- number cards
- labels
- measurements
- answer boxes

IMPORTANT:

Return ONLY valid JSON.

Do NOT return Markdown.
Do NOT use code fences.
Do NOT add commentary outside the JSON.
Do NOT invent information.
Do NOT assume values that are not visible or logically determined.

The webpage text is additional context.
The IMAGE is the primary source of truth for visual information.

Previously detected browser question type:

${JSON.stringify(
  questionType,
  null,
  2
)}

Webpage question text:

${questionText}

============================================================
PRIMARY GOAL
============================================================

Determine exactly what mathematical operation the question requires.

For example:

"What is the largest two-digit prime number?"
-> operation.type = "maximum"
-> operation.category = "arithmetic"

"Which point represents 120 fish and 80 bottles?"
-> operation.type = "coordinate_lookup"
-> operation.category = "graphs"

"How many journeys were made by the driver who drove furthest?"
-> operation.type = "maximum"
-> operation.category = "statistics"
-> operation.target = "distance_miles"
-> operation.returnValue = "journeys"

"Calculate the area of the shape."
-> operation.type = "area"
-> operation.category = "geometry"

"Work out the 4th term."
-> operation.type = "sequence_term"
-> operation.category = "sequences"

============================================================
SUPPORTED OPERATION TYPES
============================================================

Use the most specific operation possible.

Arithmetic:

add
subtract
multiply
divide
sum
difference
product
maximum
minimum
average
mean
median
mode
range

Fractions:

fraction_add
fraction_subtract
fraction_multiply
fraction_divide
equivalent_fraction
simplify_fraction
fraction_to_decimal
decimal_to_fraction

Percentages:

percentage_of
percentage_change
percentage_increase
percentage_decrease
reverse_percentage
percentage_from_fraction

Ratio and proportion:

ratio
ratio_simplify
ratio_share
proportion
direct_proportion
inverse_proportion

Algebra:

substitution
simplify
expand
factorise
solve_linear
solve_quadratic
solve_simultaneous
solve_inequality
collect_terms
rearrange_formula

Indices and standard form:

indices
index_law
standard_form
standard_form_calculation
surds
surds_simplify

Sequences:

sequence_term
sequence_next_term
pattern_next_term
sequence_rule
arithmetic_sequence
geometric_sequence
quadratic_sequence

Coordinates and graphs:

coordinate_lookup
graph_lookup
maximum_lookup
minimum_lookup
gradient
intercept
midpoint
distance
graph_difference
graph_sum
graph_average
best_fit
regression

Statistics:

mean
median
mode
range
frequency_total
frequency_mean
frequency_table
cumulative_frequency
quartile
interquartile_range
box_plot_lookup
histogram
scatter_lookup
correlation

Probability:

probability
combined_probability
probability_tree
relative_frequency
expected_frequency

Geometry:

area
perimeter
volume
surface_area
circumference
angle
angle_sum
pythagoras
similarity
scale_factor

Trigonometry:

trigonometry
sine_rule
cosine_rule
tangent
bearing

Transformations:

translation
reflection
rotation
enlargement
transformation
symmetry

Measurements:

unit_conversion
compound_measure
speed
density
pressure
time_difference
money_calculation
scale
bounds
estimation

Other:

lookup
multiple_choice
unknown

============================================================
OPERATION OBJECT
============================================================

Always provide:

"operation": {
  "category": "...",
  "type": "...",
  "target": "...",
  "returnValue": "...",
  "confidence": 0
}

operation.category:
Broad area.

operation.type:
Specific operation.

operation.target:
What quantity is being operated on.

operation.returnValue:
What the solver must actually return.

operation.confidence:
Confidence in the operation classification from 0 to 1.

============================================================
NUMERICAL ACCURACY
============================================================

Be extremely careful with:

09:59
9:59
10:04
10.04
1/2
12
x²
x^2
-4
4
0
O
1
l

Do not interpret:

09:59 as 9.59

10:04 as 10.04

1/2 as 12

x² as x2

-4 as 4

============================================================
GRAPH EXTRACTION
============================================================

When a graph exists, extract:

- x-axis label
- y-axis label
- axis minimum
- axis maximum
- grid spacing
- plotted points
- point labels
- coordinates of every visible point
- lines
- line equations when readable
- target coordinates
- requested x/y quantity

Example:

"dataPoints": [
  {
    "label": "A",
    "coordinates": [60, 120]
  },
  {
    "label": "B",
    "coordinates": [80, 120]
  }
]

============================================================
TABLE EXTRACTION
============================================================

When a table exists, preserve row/column relationships.

Use:

"tables": [
  {
    "title": "...",
    "columns": ["...", "..."],
    "rows": [
      {
        "column1": "...",
        "column2": "..."
      }
    ]
  }
]

For timetables, preserve station names and times exactly.

============================================================
STATISTICS EXTRACTION
============================================================

For scatter graphs use:

"dataPoints": [
  {
    "x": 34,
    "y": 120
  }
]

For frequency tables:

"frequencyTable": [
  {
    "value": 5,
    "frequency": 3
  }
]

For box plots:

"boxPlot": {
  "minimum": null,
  "lowerQuartile": null,
  "median": null,
  "upperQuartile": null,
  "maximum": null
}

For cumulative frequency:

"cumulativeFrequency": [
  {
    "value": 10,
    "cumulativeFrequency": 5
  }
]

============================================================
GEOMETRY EXTRACTION
============================================================

For geometry identify:

- shape
- vertices
- side lengths
- angles
- radii
- diameters
- heights
- bases
- perpendicular relationships
- parallel relationships
- equal lengths
- area
- perimeter
- volume
- surface area
- whether a dimension is implied

For an L-shape, do NOT merely list four numbers.

Describe which side each number belongs to.

============================================================
ALGEBRA EXTRACTION
============================================================

Preserve equations exactly.

Examples:

"x - 7 + 4 = 9"

"2x + 5 = 17"

"x^2 + 5x + 6 = 0"

"3x + 2y = 12"

"4x - y = 7"

For substitutions:

"expression": "3x^2 + 2x - 1"

"values": {
  "x": 4
}

============================================================
SEQUENCES
============================================================

For sequence rules extract:

"rule": "T(n)=n^2+3"

For requested terms:

"termNumber": 4

For visible terms:

"terms": [2, 5, 8, 11]

============================================================
ANGLES
============================================================

Extract:

- every visible angle
- angle labels
- parallel lines
- transversal
- corresponding angles
- alternate angles
- co-interior angles
- triangle angles
- polygon information

============================================================
TRANSFORMATIONS
============================================================

Extract:

- original coordinates
- transformed coordinates
- transformation type
- centre
- angle
- scale factor
- translation vector
- reflection axis

============================================================
DIRECT ANSWERS
============================================================

A direct answer may ONLY be included when the image clearly establishes it.

Possible fields:

structuredData.answer
structuredData.correctAnswer
structuredData.correctOption
structuredData.calculatedValue
structuredData.calculatedArea
structuredData.calculatedPerimeter
structuredData.calculatedVolume
structuredData.calculatedSurfaceArea
structuredData.targetPoint

Do NOT invent a direct answer.

============================================================
ANSWER MODEL
============================================================

Use:

single-value
multi-value
fraction
expression
multiple-choice
coordinate
table
fill_in_the_blank
unknown

============================================================
TOP LEVEL JSON
============================================================

Return EXACTLY:

{
  "questionType": "",
  "confidence": 0,

  "prompt": "",

  "numbers": [],

  "expressions": [],

  "labels": [],

  "options": [],

  "operation": {
    "category": "",
    "type": "",
    "target": "",
    "returnValue": "",
    "confidence": 0
  },

  "diagram": {
    "present": false,
    "description": "",
    "elements": []
  },

  "answerModel": "unknown",

  "structuredData": {}
}

============================================================
FINAL REQUIREMENTS
============================================================

confidence must be between 0 and 1.

operation.confidence must be between 0 and 1.

numbers must contain meaningful numerical values.

expressions must preserve mathematical meaning.

coordinates must be numeric pairs wherever possible.

graph points must be explicit.

table rows must preserve relationships.

Do not omit visible mathematical information.

Do not invent missing values.

Return JSON only.
`;

    // ==========================================================
    // PRIMARY MODEL
    // ==========================================================

    const primary =
      await this.requestModel({
        model:
          this.primaryModel,
        base64Image,
        prompt,
        mimeType
      });

    if (primary.success) {
      const parsed =
        this.parseJson(
          primary.text
        );

      if (
        parsed &&
        this.isStrongResult(
          parsed
        )
      ) {
        const normalized =
          this.normalizeVisualData(
            parsed
          );

        console.log(
          `[Gemini] Vision analysis successful using key ${primary.keyIndex} with ${primary.model}.`
        );

        return {
          success: true,
          model:
            primary.model,
          keyIndex:
            primary.keyIndex,
          text:
            primary.text,
          data:
            normalized,
          imageBytes:
            imageBytes.length,
          mimeType
        };
      }

      console.log(
        `[Gemini] ${primary.model} returned a weak result; trying fallback.`
      );
    }

    // ==========================================================
    // FALLBACK MODEL
    // ==========================================================

    const fallback =
      await this.requestModel({
        model:
          this.fallbackModel,
        base64Image,
        prompt,
        mimeType
      });

    if (fallback.success) {
      const parsed =
        this.parseJson(
          fallback.text
        );

      if (
        parsed &&
        this.isUsableResult(
          parsed
        )
      ) {
        const normalized =
          this.normalizeVisualData(
            parsed
          );

        console.log(
          `[Gemini] Vision analysis successful using key ${fallback.keyIndex} with ${fallback.model}.`
        );

        return {
          success: true,
          model:
            fallback.model,
          keyIndex:
            fallback.keyIndex,
          text:
            fallback.text,
          data:
            normalized,
          imageBytes:
            imageBytes.length,
          mimeType
        };
      }
    }

    return {
      success: false,
      model:
        fallback.model ??
        primary.model ??
        null,
      keyIndex:
        fallback.keyIndex ??
        primary.keyIndex ??
        null,
      error:
        fallback.error ??
        primary.error ??
        "Gemini vision analysis failed."
    };
  }

  // ==========================================================
  // GEMINI REQUEST
  // ==========================================================

  async requestModel({
    model,
    base64Image,
    prompt,
    mimeType = "image/png"
  }) {
    if (
      this.apiKeys.length === 0
    ) {
      return {
        success: false,
        model,
        error:
          "No Gemini API keys configured."
      };
    }

    const maxAttempts =
      this.apiKeys.length;

    let lastError = null;

    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt++
    ) {
      const {
        key,
        index
      } =
        this.getNextKey();

      console.log(
        `[Gemini] Vision request using key ${index + 1}/${this.apiKeys.length} with ${model}`
      );

      try {
        const response =
          await fetch(
            `${this.apiBase}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text:
                            prompt
                        },
                        {
                          inline_data: {
                            mime_type:
                              mimeType,
                            data:
                              base64Image
                          }
                        }
                      ]
                    }
                  ],

                  generationConfig: {
                    responseMimeType:
                      "application/json",

                    temperature: 0
                  }
                })
            }
          );

        const text =
          await response.text();

        if (!response.ok) {
          lastError =
            new Error(
              `Gemini API request failed (${response.status}): ${text}`
            );

          console.warn(
            `[Gemini] Key ${index + 1} failed on ${model}:`,
            text
          );

          continue;
        }

        let json;

        try {
          json =
            JSON.parse(
              text
            );
        } catch {
          lastError =
            new Error(
              "Gemini returned invalid JSON response."
            );

          continue;
        }

        const output =
          json?.candidates?.[0]
            ?.content?.parts
            ?.map(
              part =>
                part?.text ??
                ""
            )
            .join("")
            .trim();

        if (!output) {
          lastError =
            new Error(
              "Gemini returned no text output."
            );

          continue;
        }

        return {
          success: true,
          model,
          keyIndex:
            index + 1,
          text:
            output
        };
      } catch (error) {
        lastError =
          error;

        console.warn(
          `[Gemini] Key ${index + 1} failed on ${model}:`,
          error?.message ??
          error
        );
      }
    }

    return {
      success: false,
      model,
      error:
        lastError?.message ??
        "Unknown Gemini error"
    };
  }

  // ==========================================================
  // API KEY ROTATION
  // ==========================================================

  getNextKey() {
    if (
      this.apiKeys.length === 0
    ) {
      throw new Error(
        "No Gemini API keys configured."
      );
    }

    const index =
      this.keyIndex %
      this.apiKeys.length;

    this.keyIndex++;

    return {
      key:
        this.apiKeys[index],
      index
    };
  }

  // ==========================================================
  // NORMALIZE VISION DATA
  // ==========================================================

  normalizeVisualData(
    data
  ) {
    const source =
      data &&
      typeof data === "object"
        ? data
        : {};

    const operation =
      source.operation &&
      typeof source.operation === "object"
        ? source.operation
        : {};

    const diagram =
      source.diagram &&
      typeof source.diagram === "object"
        ? source.diagram
        : {};

    const structured =
      source.structuredData &&
      typeof source.structuredData === "object"
        ? source.structuredData
        : {};

    const normalizedOperation = {
      category:
        String(
          operation.category ??
          source.questionType ??
          "other"
        ).trim(),

      type:
        String(
          operation.type ??
          "unknown"
        ).trim(),

      target:
        String(
          operation.target ??
          ""
        ).trim(),

      returnValue:
        String(
          operation.returnValue ??
          ""
        ).trim(),

      confidence:
        this.clampConfidence(
          operation.confidence ??
          source.confidence ??
          0
        )
    };

    // --------------------------------------------------------
    // Fix common Gemini omissions
    // --------------------------------------------------------

    if (
      !normalizedOperation.type ||
      normalizedOperation.type ===
        "unknown"
    ) {
      normalizedOperation.type =
        this.inferOperationType(
          source,
          structured
        );
    }

    if (
      !normalizedOperation.category ||
      normalizedOperation.category ===
        "other"
    ) {
      normalizedOperation.category =
        this.inferOperationCategory(
          source,
          normalizedOperation.type
        );
    }

    const normalized = {
      questionType:
        String(
          source.questionType ??
          "other"
        ).trim(),

      confidence:
        this.clampConfidence(
          source.confidence ??
          0
        ),

      prompt:
        String(
          source.prompt ??
          ""
        ).trim(),

      numbers:
        Array.isArray(
          source.numbers
        )
          ? source.numbers
          : [],

      expressions:
        Array.isArray(
          source.expressions
        )
          ? source.expressions
          : [],

      labels:
        Array.isArray(
          source.labels
        )
          ? source.labels
          : [],

      options:
        Array.isArray(
          source.options
        )
          ? source.options
          : [],

      operation:
        normalizedOperation,

      diagram: {
        present:
          Boolean(
            diagram.present
          ),

        description:
          String(
            diagram.description ??
            ""
          ),

        elements:
          Array.isArray(
            diagram.elements
          )
            ? diagram.elements
            : []
      },

      answerModel:
        source.answerModel ??
        "unknown",

      structuredData:
        structured
    };

    // --------------------------------------------------------
    // Preserve useful top-level fields that may have been
    // returned by older versions of the parser.
    // --------------------------------------------------------

    if (
      normalized.structuredData
        .targetPoint === undefined &&
      source.targetPoint !== undefined
    ) {
      normalized.structuredData
        .targetPoint =
        source.targetPoint;
    }

    if (
      normalized.structuredData
        .correctAnswer === undefined &&
      source.correctAnswer !== undefined
    ) {
      normalized.structuredData
        .correctAnswer =
        source.correctAnswer;
    }

    if (
      normalized.structuredData
        .answer === undefined &&
      source.answer !== undefined
    ) {
      normalized.structuredData
        .answer =
        source.answer;
    }

    return normalized;
  }

  // ==========================================================
  // OPERATION INFERENCE
  // ==========================================================

  inferOperationType(
    data,
    structured
  ) {
    const prompt =
      String(
        data?.prompt ??
        ""
      ).toLowerCase();

    const questionType =
      String(
        data?.questionType ??
        ""
      ).toLowerCase();

    const shape =
      String(
        structured?.shape ??
        ""
      ).toLowerCase();

    if (
      structured?.targetCoordinates
    ) {
      return "coordinate_lookup";
    }

    if (
      structured?.targetPoint
    ) {
      return "graph_lookup";
    }

    if (
      structured?.calculatedArea !== undefined
    ) {
      return "area";
    }

    if (
      structured?.calculatedPerimeter !== undefined
    ) {
      return "perimeter";
    }

    if (
      structured?.calculatedVolume !== undefined
    ) {
      return "volume";
    }

    if (
      structured?.calculatedSurfaceArea !== undefined
    ) {
      return "surface_area";
    }

    if (
      structured?.frequencyTable
    ) {
      if (
        /mean|average/.test(prompt)
      ) {
        return "frequency_mean";
      }

      if (
        /total|how many/.test(prompt)
      ) {
        return "frequency_total";
      }

      return "frequency_table";
    }

    if (
      structured?.boxPlot
    ) {
      return "box_plot_lookup";
    }

    if (
      structured?.cumulativeFrequency
    ) {
      return "cumulative_frequency";
    }

    if (
      structured?.dataPoints &&
      /scatter/.test(
        questionType + " " + prompt
      )
    ) {
      if (
        /line of best fit|best fit/.test(
          prompt
        )
      ) {
        return "best_fit";
      }

      if (
        /gradient|slope/.test(
          prompt
        )
      ) {
        return "gradient";
      }

      if (
        /highest|maximum|furthest|greatest/.test(
          prompt
        )
      ) {
        return "maximum_lookup";
      }

      if (
        /lowest|minimum|smallest/.test(
          prompt
        )
      ) {
        return "minimum_lookup";
      }

      return "scatter_lookup";
    }

    if (
      structured?.rule &&
      /term|sequence/.test(
        prompt
      )
    ) {
      if (
        /next/.test(prompt)
      ) {
        return "sequence_next_term";
      }

      return "sequence_term";
    }

    if (
      structured?.equation
    ) {
      if (
        /simultaneous/.test(
          prompt
        )
      ) {
        return "solve_simultaneous";
      }

      if (
        /inequality/.test(
          prompt
        )
      ) {
        return "solve_inequality";
      }

      if (
        /quadratic/.test(
          prompt
        )
      ) {
        return "solve_quadratic";
      }

      if (
        /gradient|slope/.test(
          prompt
        )
      ) {
        return "gradient";
      }

      if (
        /intercept/.test(
          prompt
        )
      ) {
        return "intercept";
      }

      if (
        /solve|find|work out/.test(
          prompt
        )
      ) {
        return "solve_linear";
      }
    }

    if (
      /line of best fit|best fit/.test(
        prompt
      )
    ) {
      return "best_fit";
    }

    if (
      /equivalent fraction/.test(
        prompt
      )
    ) {
      return "equivalent_fraction";
    }

    if (
      /probability|chance|likelihood/.test(
        prompt
      )
    ) {
      return "probability";
    }

    if (
      /percentage/.test(
        prompt
      )
    ) {
      if (
        /increase/.test(prompt)
      ) {
        return "percentage_increase";
      }

      if (
        /decrease/.test(prompt)
      ) {
        return "percentage_decrease";
      }

      return "percentage_of";
    }

    if (
      /ratio|proportion/.test(
        prompt
      )
    ) {
      if (
        /share|split/.test(
          prompt
        )
      ) {
        return "ratio_share";
      }

      return "ratio";
    }

    if (
      /round|nearest/.test(
        prompt
      )
    ) {
      return "round";
    }

    if (
      /area/.test(
        prompt
      ) &&
      shape
    ) {
      return "area";
    }

    if (
      /perimeter|circumference/.test(
        prompt
      )
    ) {
      return "perimeter";
    }

    if (
      /surface area/.test(
        prompt
      )
    ) {
      return "surface_area";
    }

    if (
      /volume/.test(
        prompt
      )
    ) {
      return "volume";
    }

    if (
      /gradient|slope/.test(
        prompt
      )
    ) {
      return "gradient";
    }

    if (
      /intercept/.test(
        prompt
      )
    ) {
      return "intercept";
    }

    if (
      /midpoint/.test(
        prompt
      )
    ) {
      return "midpoint";
    }

    if (
      /distance|length of segment/.test(
        prompt
      )
    ) {
      return "distance";
    }

    if (
      /mean|average/.test(
        prompt
      )
    ) {
      return "mean";
    }

    if (
      /median/.test(
        prompt
      )
    ) {
      return "median";
    }

    if (
      /mode/.test(
        prompt
      )
    ) {
      return "mode";
    }

    if (
      /range/.test(
        prompt
      )
    ) {
      return "range";
    }

    if (
      /factorise|factorize/.test(
        prompt
      )
    ) {
      return "factorise";
    }

    if (
      /expand/.test(
        prompt
      )
    ) {
      return "expand";
    }

    if (
      /simplify/.test(
        prompt
      )
    ) {
      return "simplify";
    }

    if (
      /substitute|substitution/.test(
        prompt
      )
    ) {
      return "substitution";
    }

    if (
      /index|indices|power|exponent/.test(
        prompt
      )
    ) {
      return "indices";
    }

    if (
      /trigonometry|sin|cos|tan/.test(
        prompt
      )
    ) {
      return "trigonometry";
    }

    if (
      /time|journey|timetable|duration/.test(
        prompt
      )
    ) {
      return "time_difference";
    }

    if (
      /unit|convert|conversion/.test(
        prompt
      )
    ) {
      return "unit_conversion";
    }

    if (
      /speed|rate|per hour|per minute/.test(
        prompt
      )
    ) {
      return "compound_measure";
    }

    return "unknown";
  }

  // ==========================================================
  // CATEGORY INFERENCE
  // ==========================================================

  inferOperationCategory(
    data,
    operationType
  ) {
    const type =
      String(
        operationType ??
        ""
      ).toLowerCase();

    if (
      [
        "area",
        "perimeter",
        "volume",
        "surface_area",
        "circumference",
        "angle",
        "angle_sum",
        "pythagoras",
        "similarity"
      ].includes(type)
    ) {
      return "geometry";
    }

    if (
      [
        "coordinate_lookup",
        "graph_lookup",
        "gradient",
        "intercept",
        "midpoint",
        "distance",
        "best_fit",
        "regression",
        "scatter_lookup"
      ].includes(type)
    ) {
      return "graphs";
    }

    if (
      [
        "mean",
        "median",
        "mode",
        "range",
        "frequency_total",
        "frequency_mean",
        "frequency_table",
        "cumulative_frequency",
        "quartile",
        "interquartile_range",
        "box_plot_lookup",
        "histogram"
      ].includes(type)
    ) {
      return "statistics";
    }

    if (
      [
        "probability",
        "combined_probability",
        "probability_tree",
        "relative_frequency",
        "expected_frequency"
      ].includes(type)
    ) {
      return "probability";
    }

    if (
      [
        "fraction_add",
        "fraction_subtract",
        "fraction_multiply",
        "fraction_divide",
        "equivalent_fraction",
        "simplify_fraction",
        "fraction_to_decimal",
        "decimal_to_fraction"
      ].includes(type)
    ) {
      return "fractions";
    }

    if (
      [
        "percentage_of",
        "percentage_change",
        "percentage_increase",
        "percentage_decrease",
        "reverse_percentage"
      ].includes(type)
    ) {
      return "percentages";
    }

    if (
      [
        "ratio",
        "ratio_simplify",
        "ratio_share",
        "proportion",
        "direct_proportion",
        "inverse_proportion"
      ].includes(type)
    ) {
      return "ratio";
    }

    if (
      [
        "unit_conversion",
        "speed",
        "density",
        "pressure",
        "compound_measure"
      ].includes(type)
    ) {
      return "measurements";
    }

    if (
      [
        "sequence_term",
        "sequence_next_term",
        "pattern_next_term",
        "sequence_rule",
        "arithmetic_sequence",
        "geometric_sequence",
        "quadratic_sequence"
      ].includes(type)
    ) {
      return "sequences";
    }

    if (
      [
        "solve_linear",
        "solve_quadratic",
        "solve_simultaneous",
        "solve_inequality",
        "factorise",
        "expand",
        "simplify",
        "substitution",
        "indices",
        "index_law",
        "standard_form",
        "surds"
      ].includes(type)
    ) {
      return "algebra";
    }

    if (
      [
        "trigonometry",
        "sine_rule",
        "cosine_rule",
        "tangent",
        "bearing"
      ].includes(type)
    ) {
      return "trigonometry";
    }

    if (
      [
        "reflection",
        "rotation",
        "translation",
        "enlargement",
        "transformation",
        "symmetry",
        "vector"
      ].includes(type)
    ) {
      return "transformations";
    }

    if (
      [
        "time_difference",
        "money_calculation",
        "scale",
        "bounds",
        "estimation"
      ].includes(type)
    ) {
      return "measurement";
    }

    return String(
      data?.questionType ??
      "other"
    );
  }

  // ==========================================================
  // CONFIDENCE
  // ==========================================================

  clampConfidence(
    value
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    return Math.min(
      1,
      Math.max(
        0,
        number
      )
    );
  }

  // ==========================================================
  // JSON PARSER
  // ==========================================================

  parseJson(text) {
    if (!text) {
      return null;
    }

    const raw =
      String(text).trim();

    try {
      return JSON.parse(
        raw
      );
    } catch {
      // continue
    }

    const cleaned =
      raw
        .replace(
          /^```json\s*/i,
          ""
        )
        .replace(
          /^```\s*/i,
          ""
        )
        .replace(
          /```\s*$/i,
          ""
        )
        .trim();

    try {
      return JSON.parse(
        cleaned
      );
    } catch {
      // continue
    }

    const firstBrace =
      cleaned.indexOf(
        "{"
      );

    const lastBrace =
      cleaned.lastIndexOf(
        "}"
      );

    if (
      firstBrace >= 0 &&
      lastBrace > firstBrace
    ) {
      try {
        return JSON.parse(
          cleaned.slice(
            firstBrace,
            lastBrace + 1
          )
        );
      } catch {
        return null;
      }
    }

    return null;
  }

  // ==========================================================
  // STRONG RESULT CHECK
  // ==========================================================

  isStrongResult(
    result
  ) {
    if (
      !result ||
      typeof result !== "object"
    ) {
      return false;
    }

    const confidence =
      Number(
        result.confidence ?? 0
      );

    const hasPrompt =
      typeof result.prompt ===
        "string" &&
      result.prompt.trim()
        .length > 0;

    const hasNumbers =
      Array.isArray(
        result.numbers
      );

    const hasStructuredData =
      result.structuredData &&
      typeof result.structuredData ===
        "object";

    const hasOperation =
      result.operation &&
      typeof result.operation ===
        "object";

    const operationType =
      String(
        result.operation?.type ??
        ""
      ).trim();

    return (
      hasPrompt &&
      hasNumbers &&
      hasStructuredData &&
      hasOperation &&
      operationType.length > 0 &&
      (
        confidence >= 0.75 ||
        result.operation.confidence >= 0.8
      )
    );
  }

  // ==========================================================
  // USABLE FALLBACK RESULT
  // ==========================================================

  isUsableResult(
    result
  ) {
    if (
      !result ||
      typeof result !== "object"
    ) {
      return false;
    }

    const hasPrompt =
      typeof result.prompt ===
        "string" &&
      result.prompt.trim()
        .length > 0;

    const hasStructuredData =
      result.structuredData &&
      typeof result.structuredData ===
        "object";

    const hasQuestionType =
      typeof result.questionType ===
        "string" &&
      result.questionType.trim()
        .length > 0;

    return (
      hasPrompt &&
      hasStructuredData &&
      hasQuestionType
    );
  }

  // ==========================================================
  // MIME TYPE
  // ==========================================================

  detectMimeType(
    imagePath
  ) {
    const lower =
      String(
        imagePath ?? ""
      ).toLowerCase();

    if (
      lower.endsWith(
        ".jpg"
      ) ||
      lower.endsWith(
        ".jpeg"
      )
    ) {
      return "image/jpeg";
    }

    if (
      lower.endsWith(
        ".webp"
      )
    ) {
      return "image/webp";
    }

    if (
      lower.endsWith(
        ".gif"
      )
    ) {
      return "image/gif";
    }

    return "image/png";
  }
}

export default QuestionVisionParser;