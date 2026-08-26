export class QuestionSolver {
  constructor(options = {}) {
    this.visionParser =
      options.visionParser ?? null;

    this.options = {
      confidenceThreshold:
        Number(options.confidenceThreshold ?? 0.75),

      roundDecimals:
        Number(options.roundDecimals ?? 8)
    };
  }

  // ===========================================================
  // MAIN SOLVER
  // ===========================================================

  async solve(question = {}) {
    const text =
      question?.content?.normalizedText ??
      question?.content?.text ??
      question?.questionText ??
      "";

    const normalized =
      this.normalizeText(text);

    const visualData =
      question?.visualAnalysis?.visualData ??
      question?.visualAnalysis?.data ??
      null;

    const structured =
      visualData?.structuredData ??
      {};

    console.log(
      "[Solver] Question:",
      normalized
    );

    if (visualData) {
      console.log(
        "[Solver] Vision data detected:",
        visualData
      );
    }

// =========================================================
// 1. HIGH-CONFIDENCE DIRECT VISION ANSWER
// =========================================================

const directVision =
  this.solveDirectVision(
    visualData
  );

if (directVision?.success) {
  return directVision;
}

// =========================================================
// 2. MULTI-PART / FREQUENCY TABLE QUESTIONS
// =========================================================

const frequencyTable =
  this.solveFrequencyTableQuestion(
    visualData,
    normalized
  );

if (frequencyTable?.success) {
  return frequencyTable;
}

// =========================================================
// 3. VISION OPERATION ROUTING
// =========================================================

const operation =
  visualData?.operation ??
  structured?.operation ??
  null;

if (operation) {
  const routed =
    await this.solveByOperation(
      operation,
      visualData,
      normalized
    );

  if (routed?.success) {
    return routed;
  }
}

// =========================================================
// 4. GRAPH / COORDINATE QUESTIONS
// =========================================================

const graph =
  this.solveGraphQuestion(
    visualData,
    normalized
  );

if (graph?.success) {
  return graph;
}

// =========================================================
// 5. TABLE / STATISTICS
// =========================================================

const statistics =
  this.solveStatistics(
    visualData,
    normalized
  );

if (statistics?.success) {
  return statistics;
}

// =========================================================
// 6. TIME / TIMETABLE / MONEY
// =========================================================

const time =
  this.solveTimeQuestion(
    visualData,
    normalized
  );

if (time?.success) {
  return time;
}

// =========================================================
// 7. GEOMETRY / MEASUREMENT
// =========================================================

const geometry =
  this.solveGeometry(
    visualData,
    normalized
  );

if (geometry?.success) {
  return geometry;
}

// =========================================================
// 8. PROBABILITY
// =========================================================

const probability =
  this.solveProbability(
    visualData,
    normalized
  );

if (probability?.success) {
  return probability;
}

// =========================================================
// 9. FRACTIONS / PERCENTAGES / RATIO
// =========================================================

const fraction =
  this.solveFractionPercentageRatio(
    visualData,
    normalized
  );

if (fraction?.success) {
  return fraction;
}

// =========================================================
// 10. UNITS / RATES / COMPOUND MEASURES
// =========================================================

const units =
  this.solveUnitsRates(
    visualData,
    normalized
  );

if (units?.success) {
  return units;
}

// =========================================================
// 11. SEQUENCES / PATTERNS
// =========================================================

const sequence =
  this.solveSequence(
    visualData,
    normalized
  );

if (sequence?.success) {
  return sequence;
}

// =========================================================
// 12. ALGEBRA / EQUATIONS / INEQUALITIES
// =========================================================

const algebra =
  this.solveAlgebra(
    visualData,
    normalized
  );

if (algebra?.success) {
  return algebra;
}

// =========================================================
// 13. TRIGONOMETRY
// =========================================================

const trig =
  this.solveTrigonometry(
    visualData,
    normalized
  );

if (trig?.success) {
  return trig;
}

// =========================================================
// 14. COORDINATES / GRADIENT / INTERCEPT
// =========================================================

const coordinates =
  this.solveCoordinates(
    visualData,
    normalized
  );

if (coordinates?.success) {
  return coordinates;
}

// =========================================================
// 15. TRANSFORMATIONS / SYMMETRY / VECTORS
// =========================================================

const transformations =
  this.solveTransformations(
    visualData,
    normalized
  );

if (transformations?.success) {
  return transformations;
}

// =========================================================
// 16. NUMBER SKILLS
// =========================================================

const numbers =
  this.solveNumberSkills(
    visualData,
    normalized
  );

if (numbers?.success) {
  return numbers;
}

// =========================================================
// 17. BASIC ARITHMETIC
// =========================================================

const arithmetic =
  this.solveArithmetic(
    normalized
  );

if (arithmetic?.success) {
  return arithmetic;
}

// =========================================================
// FALLBACK
// =========================================================

return {
  success: false,
  method: "unresolved",
  answerModel:
    visualData?.answerModel ??
    "unknown",
  answers: null,
  analysis: {
    text: normalized,
    operation: operation ?? null,
    visualData: visualData ?? null
  },
  explanation:
    "The question was detected, but no deterministic solver matched the supplied mathematical structure."
};
  }

  // ===========================================================
  // OPERATION ROUTER
  // ===========================================================

  async solveByOperation(
    operation,
    visualData,
    normalized
  ) {
    if (!operation) {
      return null;
    }

    const category =
      String(
        operation.category ?? ""
      )
        .trim()
        .toLowerCase();

    const type =
      String(
        operation.type ?? ""
      )
        .trim()
        .toLowerCase();

    console.log(
      "[Solver] Operation:",
      {
        category,
        type,
        target:
          operation.target ?? null,
        returnValue:
          operation.returnValue ?? null
      }
    );

    // ---------------------------------------------------------
    // Arithmetic
    // ---------------------------------------------------------

    if (
      [
        "add",
        "subtract",
        "multiply",
        "divide",
        "sum",
        "difference",
        "product"
      ].includes(type)
    ) {
      const result =
        this.solveArithmetic(
          normalized
        );

      if (result?.success) {
        return result;
      }
    }


    // ---------------------------------------------------------
    // Graph / lookup
    // ---------------------------------------------------------

    if (
      [
        "lookup",
        "coordinate_lookup",
        "graph_lookup",
        "table_lookup",
        "scatter_lookup",
        "best_fit",
        "maximum",
        "minimum"
      ].includes(type)
    ) {
      const result =
        this.solveGraphQuestion(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Statistics
    // ---------------------------------------------------------

    if (
      [
        "average",
        "mean",
        "median",
        "mode",
        "range",
        "frequency_total",
        "cumulative_frequency",
        "histogram",
        "box_plot_lookup"
      ].includes(type) ||
      category === "statistics"
    ) {
      const result =
        this.solveStatistics(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Geometry
    // ---------------------------------------------------------

    if (
      [
        "area",
        "perimeter",
        "volume",
        "surface_area",
        "angle",
        "angle_sum",
        "distance"
      ].includes(type) ||
      category === "geometry" ||
      category === "measurements"
    ) {
      const result =
        this.solveGeometry(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Fractions / percentages / ratio
    // ---------------------------------------------------------

    if (
      [
        "ratio",
        "proportion",
        "percentage_of",
        "percentage_change",
        "equivalent_fraction",
        "simplify_fraction"
      ].includes(type) ||
      [
        "fractions",
        "percentages",
        "ratio"
      ].includes(category)
    ) {
      const result =
        this.solveFractionPercentageRatio(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Units / rates
    // ---------------------------------------------------------

    if (
      [
        "unit_conversion",
        "compound_measure",
        "rate",
        "speed"
      ].includes(type) ||
      [
        "units",
        "rates"
      ].includes(category)
    ) {
      const result =
        this.solveUnitsRates(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Sequences
    // ---------------------------------------------------------

    if (
      [
        "sequence_term",
        "sequence_next_term",
        "pattern_next_term"
      ].includes(type) ||
      [
        "sequences",
        "patterns"
      ].includes(category)
    ) {
      const result =
        this.solveSequence(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Algebra / equations
    // ---------------------------------------------------------

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
        "indices"
      ].includes(type) ||
      [
        "algebra",
        "equations",
        "inequalities"
      ].includes(category)
    ) {
      const result =
        this.solveAlgebra(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Trigonometry
    // ---------------------------------------------------------

    if (
      type === "trigonometry" ||
      category === "trigonometry"
    ) {
      const result =
        this.solveTrigonometry(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Coordinates / gradient / intercept
    // ---------------------------------------------------------

    if (
      [
        "gradient",
        "intercept",
        "midpoint",
        "distance",
        "vector",
        "bearing",
        "scale"
      ].includes(type) ||
      [
        "coordinates",
        "vectors"
      ].includes(category)
    ) {
      const result =
        this.solveCoordinates(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Transformations / symmetry
    // ---------------------------------------------------------

    if (
      [
        "transformation",
        "symmetry"
      ].includes(type) ||
      [
        "transformations",
        "symmetry"
      ].includes(category)
    ) {
      const result =
        this.solveTransformations(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Probability
    // ---------------------------------------------------------

    if (
      type === "probability" ||
      category === "probability"
    ) {
      const result =
        this.solveProbability(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Time / money
    // ---------------------------------------------------------

    if (
      [
        "time_difference",
        "money_calculation"
      ].includes(type) ||
      [
        "time",
        "money"
      ].includes(category)
    ) {
      const result =
        this.solveTimeQuestion(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    // ---------------------------------------------------------
    // Number skills
    // ---------------------------------------------------------

    if (
      [
        "round",
        "estimation",
        "standard_form",
        "bounds"
      ].includes(type) ||
      [
        "rounding"
      ].includes(category)
    ) {
      const result =
        this.solveNumberSkills(
          visualData,
          normalized
        );

      if (result?.success) {
        return result;
      }
    }

    return null;
  }

  // ===========================================================
  // NORMALIZATION
  // ===========================================================

  normalizeText(text) {
    return String(
      text ?? ""
    )
      .replace(
        /\u200B/g,
        ""
      )
      .replace(
        /\u2060/g,
        ""
      )
      .replace(
        /\u00A0/g,
        " "
      )
      .replace(
        /[−–—]/g,
        "-"
      )
      .replace(
        /×/g,
        "*"
      )
      .replace(
        /÷/g,
        "/"
      )
      .replace(
        /²/g,
        "^2"
      )
      .replace(
        /³/g,
        "^3"
      )
      .replace(
        /√/g,
        "sqrt"
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }

  // ===========================================================
  // DIRECT VISION ANSWER
  // ===========================================================

  solveDirectVision(
    visualData
  ) {
    if (
      !visualData ||
      typeof visualData !==
        "object"
    ) {
      return null;
    }

    const structured =
      visualData.structuredData ??
      {};

    /*
     * Deliberately DO NOT treat every numeric field as a
     * guaranteed answer.
     *
     * For example:
     *
     * calculatedArea
     * calculatedValue
     *
     * are only accepted when the Vision parser explicitly
     * supplied them.
     */

    const candidates = [
      structured.answer,
      structured.correctAnswer,
      structured.correctOption,
      structured.selectedOption,
      structured.targetPoint,
      structured.correctPoint
    ];

    for (
      const candidate of candidates
    ) {
      if (
        candidate !== null &&
        candidate !== undefined &&
        String(candidate).trim() !== ""
      ) {
        return {
          success: true,

          method:
            "vision-direct-answer",

          answerModel:
            visualData.answerModel ??
            "unknown",

          answers: {
            value:
              candidate
          },

          analysis: {
            questionType:
              visualData.questionType ??
              "unknown",

            directAnswer:
              candidate,

            operation:
              visualData.operation ??
              null,

            structuredData:
              structured
          },

          explanation:
            "Gemini Vision supplied a structured answer."
        };
      }
    }

    // ---------------------------------------------------------
    // Explicit calculated values
    // ---------------------------------------------------------

    const calculatedCandidates = [
      [
        "calculatedArea",
        /area/i
      ],
      [
        "calculatedPerimeter",
        /perimeter/i
      ],
      [
        "calculatedVolume",
        /volume/i
      ],
      [
        "calculatedSurfaceArea",
        /surface\s+area/i
      ],
      [
        "calculatedValue",
        null
      ]
    ];

    for (
      const [
        key,
        pattern
      ] of calculatedCandidates
    ) {
      const value =
        Number(
          structured[key]
        );

      if (
        !Number.isFinite(value)
      ) {
        continue;
      }

      if (
        pattern &&
        !pattern.test(
          String(
            visualData.prompt ??
            ""
          )
        )
      ) {
        continue;
      }

      return {
        success: true,

        method:
          "vision-calculated-answer",

        answerModel:
          visualData.answerModel ??
          "single-value",

        answers: {
          value
        },

        analysis: {
          questionType:
            visualData.questionType ??
            "unknown",

          sourceField:
            key,

          value,

          structuredData:
            structured
        },

        explanation:
          `Gemini Vision supplied ${key} = ${value}.`
      };
    }

    // ---------------------------------------------------------
    // Explicit best-fit graph
    // ---------------------------------------------------------

    if (
      /line\s+of\s+best\s+fit/i.test(
        String(
          visualData.prompt ??
          ""
        )
      )
    ) {
      const options =
        Array.isArray(
          structured.graphOptions
        )
          ? structured.graphOptions
          : [];

      const best =
        this.chooseBestFitGraph(
          options
        );

      if (best) {
        return {
          success: true,

          method:
            "vision-line-of-best-fit",

          answerModel:
            "multiple-choice",

          answers: {
            value:
              best.label
          },

          analysis: {
            options,
            selected:
              best.label
          },

          explanation:
            `Selected option ${best.label} as the most suitable line of best fit.`
        };
      }
    }

    return null;
  }

  // ===========================================================
  // GRAPH BEST-FIT HEURISTIC
  // ===========================================================

  chooseBestFitGraph(
    options
  ) {
    if (
      !Array.isArray(options) ||
      options.length === 0
    ) {
      return null;
    }

    const positivePatterns = [
      /central/i,
      /main\s+trend/i,
      /best\s+fit/i,
      /closely\s+following/i,
      /follows?\s+the\s+trend/i,
      /passes?\s+through\s+the\s+middle/i,
      /balanced/i
    ];

    const negativePatterns = [
      /negative\s+slope/i,
      /shifted\s+(?:well\s+)?above/i,
      /shifted\s+(?:well\s+)?below/i,
      /too\s+shallow/i,
      /too\s+steep/i,
      /does\s+not\s+match/i,
      /away\s+from/i,
      /not\s+a\s+good\s+fit/i
    ];

    let best =
      null;

    let bestScore =
      -Infinity;

    for (
      const option of options
    ) {
      if (
        !option ||
        !option.label
      ) {
        continue;
      }

      const description =
        String(
          option.lineDescription ??
          option.description ??
          ""
        );

      let score = 0;

      for (
        const pattern of
          positivePatterns
      ) {
        if (
          pattern.test(
            description
          )
        ) {
          score += 10;
        }
      }

      for (
        const pattern of
          negativePatterns
      ) {
        if (
          pattern.test(
            description
          )
        ) {
          score -= 8;
        }
      }

      if (
        score >
        bestScore
      ) {
        bestScore =
          score;

        best =
          option;
      }
    }

    return bestScore > 0
      ? best
      : null;
  }

    // ===========================================================
  // GRAPH / COORDINATE QUESTIONS
  // ===========================================================

  solveGraphQuestion(
    visualData,
    normalized
  ) {
    if (!visualData) {
      return null;
    }

    const structured =
      visualData.structuredData ??
      {};

    const points =
      this.extractPoints(
        structured
      );

    // ---------------------------------------------------------
    // Coordinate lookup
    // ---------------------------------------------------------

    const target =
      structured.targetCoordinates ??
      structured.targetCoordinate ??
      null;

    if (
      target &&
      Number.isFinite(
        Number(target.x)
      ) &&
      Number.isFinite(
        Number(target.y)
      ) &&
      points.length > 0
    ) {
      const targetX =
        Number(target.x);

      const targetY =
        Number(target.y);

      const match =
        points.find(
          point =>
            this.nearlyEqual(
              point.x,
              targetX
            ) &&
            this.nearlyEqual(
              point.y,
              targetY
            )
        );

      if (match) {
        return {
          success: true,

          method:
            "graph-coordinate-lookup",

          answerModel:
            visualData.answerModel ??
            "single-value",

          answers: {
            value:
              match.label ??
              `${match.x},${match.y}`
          },

          analysis: {
            target: {
              x: targetX,
              y: targetY
            },

            matchedPoint:
              match,

            points
          },

          explanation:
            `The point at (${targetX}, ${targetY}) is ${
              match.label ??
              "the matching point"
            }.`
        };
      }
    }

    // ---------------------------------------------------------
    // Gemini may already identify the point
    // ---------------------------------------------------------

    const targetPoint =
      structured.targetPoint ??
      structured.correctPoint ??
      structured.selectedPoint ??
      structured.selectedOption ??
      null;

    if (
      targetPoint !== null &&
      targetPoint !== undefined &&
      String(targetPoint).trim() !== ""
    ) {
      return {
        success: true,

        method:
          "graph-target-point",

        answerModel:
          visualData.answerModel ??
          "single-value",

        answers: {
          value:
            String(
              targetPoint
            ).trim()
        },

        analysis: {
          questionType:
            visualData.questionType ??
            "graph",

          targetPoint:
            String(
              targetPoint
            ).trim(),

          targetCoordinates:
            target ??
            null,

          points
        },

        explanation:
          `The graph answer is point ${String(
            targetPoint
          ).trim()}.`
      };
    }

    // ---------------------------------------------------------
    // Maximum / highest / furthest
    // ---------------------------------------------------------

    if (
      points.length > 0 &&
      /(highest|largest|maximum|max|furthest|greatest)/i.test(
        normalized
      )
    ) {
      const yMax =
        Math.max(
          ...points.map(
            point =>
              Number(point.y)
          )
        );

      const candidates =
        points.filter(
          point =>
            this.nearlyEqual(
              Number(point.y),
              yMax
            )
        );

      const match =
        candidates[0];

      if (match) {
        const value =
          this.chooseGraphReturnValue(
            normalized,
            match
          );

        return {
          success: true,

          method:
            "graph-maximum-lookup",

          answerModel:
            "single-value",

          answers: {
            value
          },

          analysis: {
            points,
            selectedPoint:
              match,
            maximumY:
              yMax,
            returnValue:
              value
          },

          explanation:
            `The highest plotted value is ${yMax}; the requested value is ${value}.`
        };
      }
    }

    // ---------------------------------------------------------
    // Minimum / lowest
    // ---------------------------------------------------------

    if (
      points.length > 0 &&
      /(lowest|smallest|minimum|min)/i.test(
        normalized
      )
    ) {
      const yMin =
        Math.min(
          ...points.map(
            point =>
              Number(point.y)
          )
        );

      const candidates =
        points.filter(
          point =>
            this.nearlyEqual(
              Number(point.y),
              yMin
            )
        );

      const match =
        candidates[0];

      if (match) {
        const value =
          this.chooseGraphReturnValue(
            normalized,
            match
          );

        return {
          success: true,

          method:
            "graph-minimum-lookup",

          answerModel:
            "single-value",

          answers: {
            value
          },

          analysis: {
            points,
            selectedPoint:
              match,
            minimumY:
              yMin,
            returnValue:
              value
          },

          explanation:
            `The lowest plotted value is ${yMin}; the requested value is ${value}.`
        };
      }
    }

    // ---------------------------------------------------------
    // Explicit x/y lookup from operation target
    // ---------------------------------------------------------

    if (
      points.length > 0 &&
      /how many|number of|value of|what is the/i.test(
        normalized
      )
    ) {
      const targetDescription =
        String(
          structured.target ??
          visualData.operation?.target ??
          ""
        ).toLowerCase();

      const returnDescription =
        String(
          structured.returnValue ??
          visualData.operation?.returnValue ??
          ""
        ).toLowerCase();

      const maxY =
        Math.max(
          ...points.map(
            point =>
              Number(point.y)
          )
        );

      if (
        /maximum|max|highest|furthest|greatest/.test(
          targetDescription
        )
      ) {
        const matching =
          points.find(
            point =>
              this.nearlyEqual(
                point.y,
                maxY
              )
          );

        if (matching) {
          const value =
            this.getRequestedGraphValue(
              matching,
              returnDescription
            );

          return {
            success: true,

            method:
              "graph-operation-lookup",

            answerModel:
              visualData.answerModel ??
              "single-value",

            answers: {
              value
            },

            analysis: {
              points,
              target:
                targetDescription,
              returnValue:
                returnDescription,
              selected:
                matching
            },

            explanation:
              `The graph lookup gives ${value}.`
          };
        }
      }
    }

    // ---------------------------------------------------------
    // Line of best fit
    // ---------------------------------------------------------

    if (
      /line\s+of\s+best\s+fit/i.test(
        normalized
      ) ||
      visualData?.operation?.type ===
        "best_fit"
    ) {
      const graphOptions =
        Array.isArray(
          structured.graphOptions
        )
          ? structured.graphOptions
          : [];

      const best =
        this.chooseBestFitGraph(
          graphOptions
        );

      if (best) {
        return {
          success: true,

          method:
            "line-of-best-fit",

          answerModel:
            "multiple-choice",

          answers: {
            value:
              String(
                best.label
              ).trim()
          },

          analysis: {
            options:
              graphOptions,

            selected:
              best.label
          },

          explanation:
            `Option ${best.label} is the most suitable line of best fit.`
        };
      }

      const labels =
        Array.isArray(
          visualData.options
        )
          ? visualData.options
          : [];

      if (
        labels.length > 0
      ) {
        const selected =
          this.chooseBestFitFromLabels(
            labels
          );

        if (selected) {
          return {
            success: true,

            method:
              "line-of-best-fit",

            answerModel:
              "multiple-choice",

            answers: {
              value:
                selected
            },

            analysis: {
              options:
                labels,

              selected
            },

            explanation:
              `Option ${selected} was identified as the most suitable line of best fit.`
          };
        }
      }
    }

    // ---------------------------------------------------------
    // Scatter graph regression
    // ---------------------------------------------------------

    if (
      points.length >= 2 &&
      /(gradient|slope|regression|line of best fit|equation of the line)/i.test(
        normalized
      )
    ) {
      const regression =
        this.linearRegression(
          points
        );

      if (regression) {
        if (
          /gradient|slope/i.test(
            normalized
          )
        ) {
          return this.result(
            "scatter-gradient",
            "single-value",
            this.roundNumber(
              regression.slope
            ),
            {
              points,
              regression
            },
            `The gradient is approximately ${this.roundNumber(
              regression.slope
            )}.`
          );
        }

        if (
          /equation/i.test(
            normalized
          )
        ) {
          const slope =
            this.roundNumber(
              regression.slope
            );

          const intercept =
            this.roundNumber(
              regression.intercept
            );

          const equation =
            `y = ${slope}x ${
              intercept >= 0
                ? "+"
                : "-"
            } ${Math.abs(
              intercept
            )}`;

          return this.result(
            "scatter-regression-equation",
            "expression",
            equation,
            {
              points,
              regression
            },
            `The line of best fit is approximately ${equation}.`
          );
        }
      }
    }

    // ---------------------------------------------------------
    // x/y axis direct lookup
    // ---------------------------------------------------------

    const xAxis =
      structured.xAxis;

    const yAxis =
      structured.yAxis;

    if (
      points.length > 0 &&
      xAxis &&
      yAxis &&
      /coordinate|graph|plot|point/i.test(
        normalized
      )
    ) {
      const operationType =
        String(
          visualData?.operation?.type ??
          ""
        ).toLowerCase();

      if (
        operationType ===
          "lookup" ||
        operationType ===
          "coordinate_lookup" ||
        operationType ===
          "graph_lookup"
      ) {
        return null;
      }
    }

    return null;
  }

  // ===========================================================
  // EXTRACT GRAPH POINTS
  // ===========================================================

  extractPoints(
    structured
  ) {
    const result = [];

    if (
      !structured ||
      typeof structured !==
        "object"
    ) {
      return result;
    }

    const sources = [
      structured.dataPoints,
      structured.points,
      structured.coordinates,
      structured.graphPoints,
      structured.plotPoints,
      structured.series
    ];

    for (
      const source of sources
    ) {
      if (
        !Array.isArray(
          source
        )
      ) {
        continue;
      }

      for (
        const item of source
      ) {
        if (
          Array.isArray(item) &&
          item.length >= 2
        ) {
          const x =
            Number(
              item[0]
            );

          const y =
            Number(
              item[1]
            );

          if (
            Number.isFinite(x) &&
            Number.isFinite(y)
          ) {
            result.push({
              x,
              y,
              label:
                null
            });
          }

          continue;
        }

        if (
          !item ||
          typeof item !==
            "object"
        ) {
          continue;
        }

        // [x, y] stored in coordinates
        if (
          Array.isArray(
            item.coordinates
          ) &&
          item.coordinates.length >= 2
        ) {
          const x =
            Number(
              item.coordinates[0]
            );

          const y =
            Number(
              item.coordinates[1]
            );

          if (
            Number.isFinite(x) &&
            Number.isFinite(y)
          ) {
            result.push({
              x,
              y,
              label:
                item.label ??
                null
            });
          }

          continue;
        }

        // Common Sparx/Gemini field names
        const x =
          this.firstFinite(
            item.x,
            item.xValue,
            item.coordinateX,
            item.journeys,
            item.numberOfJourneys,
            item.horizontal
          );

        const y =
          this.firstFinite(
            item.y,
            item.yValue,
            item.coordinateY,
            item.distance,
            item.distance_miles,
            item.value,
            item.vertical
          );

        if (
          x !== null &&
          y !== null
        ) {
          result.push({
            x,
            y,
            label:
              item.label ??
              item.name ??
              null
          });
        }
      }
    }

    // ---------------------------------------------------------
    // Remove duplicate points
    // ---------------------------------------------------------

    const unique = [];
    const seen = new Set();

    for (
      const point of result
    ) {
      const key =
        `${point.x}|${point.y}|${point.label ?? ""}`;

      if (
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);
      unique.push(point);
    }

    return unique;
  }

  // ===========================================================
  // GRAPH RETURN VALUE
  // ===========================================================

  chooseGraphReturnValue(
    normalized,
    point
  ) {
    const text =
      String(
        normalized ??
        ""
      ).toLowerCase();

    if (
      /how many journeys|number of journeys|number of|horizontal|x-axis|x value|x-coordinate|x coordinate/i.test(
        text
      )
    ) {
      return point.x;
    }

    if (
      /vertical|y-axis|y value|y-coordinate|y coordinate|distance|height|amount/i.test(
        text
      )
    ) {
      return point.y;
    }

    return point.y;
  }

  // ===========================================================
  // GRAPH OPERATION RETURN VALUE
  // ===========================================================

  getRequestedGraphValue(
    point,
    returnDescription
  ) {
    const text =
      String(
        returnDescription ??
        ""
      ).toLowerCase();

    if (
      /journey|number|x|horizontal/.test(
        text
      )
    ) {
      return point.x;
    }

    return point.y;
  }

  // ===========================================================
  // LINEAR REGRESSION
  // ===========================================================

  linearRegression(
    points
  ) {
    if (
      !Array.isArray(points) ||
      points.length < 2
    ) {
      return null;
    }

    const usable =
      points.filter(
        point =>
          Number.isFinite(
            Number(point.x)
          ) &&
          Number.isFinite(
            Number(point.y)
          )
      );

    if (
      usable.length < 2
    ) {
      return null;
    }

    const n =
      usable.length;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (
      const point of usable
    ) {
      const x =
        Number(point.x);

      const y =
        Number(point.y);

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const denominator =
      n * sumXX -
      sumX * sumX;

    if (
      Math.abs(
        denominator
      ) < 1e-12
    ) {
      return null;
    }

    const slope =
      (
        n * sumXY -
        sumX * sumY
      ) /
      denominator;

    const intercept =
      (
        sumY -
        slope * sumX
      ) /
      n;

    const equation =
      `y = ${this.roundNumber(
        slope
      )}x ${
        intercept >= 0
          ? "+"
          : "-"
      } ${Math.abs(
        this.roundNumber(
          intercept
        )
      )}`;

    return {
      slope,
      intercept,
      equation,
      count:
        usable.length
    };
  }

  // ===========================================================
  // BEST FIT FROM PLAIN OPTION LABELS
  // ===========================================================

  chooseBestFitFromLabels(
    options
  ) {
    if (
      !Array.isArray(
        options
      )
    ) {
      return null;
    }

    const joined =
      options
        .map(
          option =>
            String(
              option
            )
        )
        .join(" ")
        .toLowerCase();

    if (
      !/central|main trend|best fit|closely following|middle of the data/i.test(
        joined
      )
    ) {
      return null;
    }

    const letter =
      options.find(
        option =>
          /^[A-H]$/i.test(
            String(
              option
            ).trim()
          )
      );

    return letter
      ? String(
          letter
        ).trim()
      : null;
  }

  // ===========================================================
  // STATISTICS / TABLES
  // ===========================================================

  solveStatistics(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    const values =
      this.extractNumericArray(
        structured.values ??
        structured.data ??
        structured.numbers ??
        structured.observations ??
        visualData?.numbers
      );

    const points =
      this.extractPoints(
        structured
      );

    // ---------------------------------------------------------
    // Mean / average
    // ---------------------------------------------------------

    if (
      values.length > 0 &&
      /(average|mean)/i.test(
        normalized
      )
    ) {
      const mean =
        this.mean(
          values
        );

      return this.result(
        "statistics-mean",
        "single-value",
        this.roundNumber(
          mean
        ),
        {
          values,
          mean
        },
        `The mean is ${this.roundNumber(
          mean
        )}.`
      );
    }

    // ---------------------------------------------------------
    // Median
    // ---------------------------------------------------------

    if (
      values.length > 0 &&
      /\bmedian\b/i.test(
        normalized
      )
    ) {
      const median =
        this.median(
          values
        );

      return this.result(
        "statistics-median",
        "single-value",
        this.roundNumber(
          median
        ),
        {
          values,
          median
        },
        `The median is ${this.roundNumber(
          median
        )}.`
      );
    }

    // ---------------------------------------------------------
    // Mode
    // ---------------------------------------------------------

    if (
      values.length > 0 &&
      /\bmode\b/i.test(
        normalized
      )
    ) {
      const mode =
        this.mode(
          values
        );

      if (
        mode !== null
      ) {
        return this.result(
          "statistics-mode",
          "single-value",
          mode,
          {
            values,
            mode
          },
          `The mode is ${mode}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Range
    // ---------------------------------------------------------

    if (
      values.length > 0 &&
      /\brange\b/i.test(
        normalized
      )
    ) {
      const minimum =
        Math.min(
          ...values
        );

      const maximum =
        Math.max(
          ...values
        );

      const range =
        maximum -
        minimum;

      return this.result(
        "statistics-range",
        "single-value",
        range,
        {
          values,
          minimum,
          maximum,
          range
        },
        `The range is ${range}.`
      );
    }

    // ---------------------------------------------------------
    // Maximum
    // ---------------------------------------------------------

    if (
      values.length > 0 &&
      /(maximum|max|largest|highest)/i.test(
        normalized
      )
    ) {
      const value =
        Math.max(
          ...values
        );

      return this.result(
        "statistics-maximum",
        "single-value",
        value,
        {
          values
        },
        `The maximum value is ${value}.`
      );
    }

    // ---------------------------------------------------------
    // Minimum
    // ---------------------------------------------------------

    if (
      values.length > 0 &&
      /(minimum|min|smallest|lowest)/i.test(
        normalized
      )
    ) {
      const value =
        Math.min(
          ...values
        );

      return this.result(
        "statistics-minimum",
        "single-value",
        value,
        {
          values
        },
        `The minimum value is ${value}.`
      );
    }

    // ---------------------------------------------------------
    // Scatter graph
    // ---------------------------------------------------------

    if (
      points.length >= 2 &&
      /scatter|correlation|data point/i.test(
        normalized
      )
    ) {
      if (
        /gradient|slope/i.test(
          normalized
        )
      ) {
        const regression =
          this.linearRegression(
            points
          );

        if (
          regression
        ) {
          return this.result(
            "scatter-gradient",
            "single-value",
            this.roundNumber(
              regression.slope
            ),
            {
              points,
              regression
            },
            `The gradient is approximately ${this.roundNumber(
              regression.slope
            )}.`
          );
        }
      }

      // Correlation direction
      if (
        /positive correlation/i.test(
          normalized
        )
      ) {
        const regression =
          this.linearRegression(
            points
          );

        if (
          regression &&
          regression.slope > 0
        ) {
          return this.result(
            "scatter-positive-correlation",
            "expression",
            "positive",
            {
              points,
              slope:
                regression.slope
            },
            "The data shows positive correlation."
          );
        }
      }

      if (
        /negative correlation/i.test(
          normalized
        )
      ) {
        const regression =
          this.linearRegression(
            points
          );

        if (
          regression &&
          regression.slope < 0
        ) {
          return this.result(
            "scatter-negative-correlation",
            "expression",
            "negative",
            {
              points,
              slope:
                regression.slope
            },
            "The data shows negative correlation."
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Frequency table
    // ---------------------------------------------------------

    const frequencyTable =
      structured.frequencyTable ??
      structured.frequencies ??
      null;

    if (
      Array.isArray(
        frequencyTable
      )
    ) {
      const table =
        frequencyTable
          .map(
            row => ({
              value:
                Number(
                  row?.value ??
                  row?.x ??
                  row?.label
                ),

              frequency:
                Number(
                  row?.frequency ??
                  row?.f ??
                  row?.count
                )
            })
          )
          .filter(
            row =>
              Number.isFinite(
                row.value
              ) &&
              Number.isFinite(
                row.frequency
              )
          );

      if (
        table.length > 0
      ) {
        const totalFrequency =
          table.reduce(
            (
              sum,
              row
            ) =>
              sum +
              row.frequency,
            0
          );

        // Total frequency

        if (
          /total frequency|how many.*(?:people|items|students|values)|frequency total/i.test(
            normalized
          )
        ) {
          return this.result(
            "frequency-total",
            "single-value",
            totalFrequency,
            {
              table,
              totalFrequency
            },
            `The total frequency is ${totalFrequency}.`
          );
        }

        // Weighted mean

        if (
          /mean|average/i.test(
            normalized
          )
        ) {
          const weighted =
            table.reduce(
              (
                sum,
                row
              ) =>
                sum +
                row.value *
                  row.frequency,
              0
            );

          const mean =
            weighted /
            totalFrequency;

          return this.result(
            "frequency-mean",
            "single-value",
            this.roundNumber(
              mean
            ),
            {
              table,
              totalFrequency,
              weighted,
              mean
            },
            `The mean is ${this.roundNumber(
              mean
            )}.`
          );
        }

        // Frequency maximum

        if (
          /highest frequency|most common|modal class|mode/i.test(
            normalized
          )
        ) {
          const maximumFrequency =
            Math.max(
              ...table.map(
                row =>
                  row.frequency
              )
            );

          const match =
            table.find(
              row =>
                row.frequency ===
                maximumFrequency
            );

          if (match) {
            return this.result(
              "frequency-mode",
              "single-value",
              match.value,
              {
                table,
                maximumFrequency,
                selected:
                  match
              },
              `The most frequent value is ${match.value}.`
            );
          }
        }
      }
    }

    // ---------------------------------------------------------
    // Cumulative frequency
    // ---------------------------------------------------------

    const cumulative =
      structured.cumulativeFrequency ??
      structured.cumulative ??
      null;

    if (
      Array.isArray(
        cumulative
      ) &&
      /cumulative frequency|quartile|median/i.test(
        normalized
      )
    ) {
      const rows =
        cumulative
          .map(
            row => ({
              value:
                Number(
                  row?.value ??
                  row?.x
                ),

              cumulativeFrequency:
                Number(
                  row?.cumulativeFrequency ??
                  row?.frequency ??
                  row?.y
                )
            })
          )
          .filter(
            row =>
              Number.isFinite(
                row.value
              ) &&
              Number.isFinite(
                row.cumulativeFrequency
              )
          );

      if (
        rows.length > 0
      ) {
        const total =
          rows[
            rows.length - 1
          ]
            .cumulativeFrequency;

        let target =
          null;

        let targetName =
          "median";

        if (
          /upper quartile|q3/i.test(
            normalized
          )
        ) {
          target =
            total * 0.75;

          targetName =
            "upper quartile";
        } else if (
          /lower quartile|q1/i.test(
            normalized
          )
        ) {
          target =
            total * 0.25;

          targetName =
            "lower quartile";
        } else if (
          /median/i.test(
            normalized
          )
        ) {
          target =
            total * 0.5;

          targetName =
            "median";
        }

        if (
          target !== null
        ) {
          const row =
            rows.find(
              item =>
                item.cumulativeFrequency >=
                target
            );

          if (row) {
            return this.result(
              "cumulative-frequency-lookup",
              "single-value",
              row.value,
              {
                rows,
                total,
                target,
                targetName,
                selected:
                  row
              },
              `The ${targetName} is approximately ${row.value}.`
            );
          }
        }
      }
    }

    // ---------------------------------------------------------
    // Box plot
    // ---------------------------------------------------------

    const box =
      structured.boxPlot ??
      structured.boxplot ??
      null;

    if (
      box &&
      typeof box ===
        "object"
    ) {
      let key =
        null;

      if (
        /upper quartile|q3/i.test(
          normalized
        )
      ) {
        key =
          "upperQuartile";
      } else if (
        /lower quartile|q1/i.test(
          normalized
        )
      ) {
        key =
          "lowerQuartile";
      } else if (
        /median/i.test(
          normalized
        )
      ) {
        key =
          "median";
      } else if (
        /maximum|max/i.test(
          normalized
        )
      ) {
        key =
          "maximum";
      } else if (
        /minimum|min/i.test(
          normalized
        )
      ) {
        key =
          "minimum";
      }

      if (
        key &&
        box[key] !==
          undefined &&
        Number.isFinite(
          Number(
            box[key]
          )
        )
      ) {
        return this.result(
          `boxplot-${key}`,
          "single-value",
          Number(
            box[key]
          ),
          {
            box
          },
          `The ${key} is ${box[key]}.`
        );
      }
    }

    return null;
  }

  // ===========================================================
  // NUMERIC ARRAY EXTRACTION
  // ===========================================================

  extractNumericArray(
    value
  ) {
    if (
      !Array.isArray(
        value
      )
    ) {
      return [];
    }

    const result =
      [];

    for (
      const item of value
    ) {
      if (
        typeof item ===
          "number" &&
        Number.isFinite(
          item
        )
      ) {
        result.push(
          item
        );

        continue;
      }

      if (
        typeof item ===
          "string" &&
        item.trim() !== ""
      ) {
        const number =
          Number(
            item
          );

        if (
          Number.isFinite(
            number
          )
        ) {
          result.push(
            number
          );
        }

        continue;
      }

      if (
        item &&
        typeof item ===
          "object"
      ) {
        const number =
          this.firstFinite(
            item.value,
            item.number,
            item.y,
            item.frequency,
            item.count
          );

        if (
          number !== null
        ) {
          result.push(
            number
          );
        }
      }
    }

    return result;
  }

  // ===========================================================
  // MEAN
  // ===========================================================

  mean(
    values
  ) {
    if (
      !Array.isArray(
        values
      ) ||
      values.length === 0
    ) {
      return null;
    }

    return (
      values.reduce(
        (
          sum,
          value
        ) =>
          sum +
          Number(value),
        0
      ) /
      values.length
    );
  }

  // ===========================================================
  // MEDIAN
  // ===========================================================

  median(
    values
  ) {
    if (
      !Array.isArray(
        values
      ) ||
      values.length === 0
    ) {
      return null;
    }

    const sorted =
      values
        .map(
          Number
        )
        .filter(
          Number.isFinite
        )
        .sort(
          (
            a,
            b
          ) =>
            a - b
        );

    if (
      sorted.length === 0
    ) {
      return null;
    }

    const middle =
      Math.floor(
        sorted.length / 2
      );

    if (
      sorted.length % 2 ===
      0
    ) {
      return (
        sorted[
          middle - 1
        ] +
        sorted[
          middle
        ]
      ) / 2;
    }

    return sorted[
      middle
    ];
  }

  // ===========================================================
  // MODE
  // ===========================================================

  mode(
    values
  ) {
    if (
      !Array.isArray(
        values
      ) ||
      values.length === 0
    ) {
      return null;
    }

    const counts =
      new Map();

    for (
      const value of values
    ) {
      counts.set(
        value,
        (
          counts.get(
            value
          ) ??
          0
        ) + 1
      );
    }

    let best =
      null;

    let highest =
      0;

    for (
      const [
        value,
        count
      ] of counts
    ) {
      if (
        count >
        highest
      ) {
        highest =
          count;

        best =
          value;
      }
    }

    return highest >
      1
      ? best
      : null;
  }

    // ===========================================================
  // TIME / TIMETABLE / MONEY
  // ===========================================================

  solveTimeQuestion(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Structured timetable
    // ---------------------------------------------------------

    if (
      structured.departure_station &&
      structured.departure_time &&
      structured.destination &&
      Array.isArray(
        structured.tables
      )
    ) {
      const timetable =
        this.solveTrainTimetable(
          visualData
        );

      if (
        timetable?.success
      ) {
        return timetable;
      }
    }

    // ---------------------------------------------------------
    // Generic HH:MM duration
    // ---------------------------------------------------------

    const timeMatches =
      [
        ...String(
          normalized ?? ""
        ).matchAll(
          /\b(\d{1,2}):(\d{2})\b/g
        )
      ];

    if (
      timeMatches.length >= 2 &&
      /(how long|duration|journey|time taken|difference between|takes|travel)/i.test(
        normalized
      )
    ) {
      const start =
        this.toMinutes(
          timeMatches[0][0]
        );

      const end =
        this.toMinutes(
          timeMatches[1][0]
        );

      if (
        start !== null &&
        end !== null
      ) {
        let duration =
          end - start;

        if (
          duration < 0
        ) {
          duration +=
            1440;
        }

        const hours =
          Math.floor(
            duration / 60
          );

        const minutes =
          duration % 60;

        return this.result(
          "time-duration",
          "multi-value",
          {
            hours,
            minutes,
            totalMinutes:
              duration
          },
          {
            start:
              timeMatches[0][0],
            end:
              timeMatches[1][0],
            duration
          },
          `The time taken is ${hours} hours and ${minutes} minutes.`
        );
      }
    }

    // ---------------------------------------------------------
    // Add/subtract minutes from a time
    // ---------------------------------------------------------

    const minuteChange =
      normalized.match(
        /(?:add|plus|after|later)\s+(\d+)\s+minutes?.*?\b(\d{1,2}:\d{2})\b/i
      );

    if (
      minuteChange
    ) {
      const amount =
        Number(
          minuteChange[1]
        );

      const base =
        this.toMinutes(
          minuteChange[2]
        );

      if (
        base !== null
      ) {
        const resultTime =
          this.formatMinutes(
            base + amount
          );

        return this.result(
          "time-add-minutes",
          "single-value",
          resultTime,
          {
            base:
              minuteChange[2],
            minutes:
              amount,
            result:
              resultTime
          },
          `${minuteChange[2]} plus ${amount} minutes is ${resultTime}.`
        );
      }
    }

    const minuteSubtract =
      normalized.match(
        /(?:subtract|minus|before|earlier)\s+(\d+)\s+minutes?.*?\b(\d{1,2}:\d{2})\b/i
      );

    if (
      minuteSubtract
    ) {
      const amount =
        Number(
          minuteSubtract[1]
        );

      const base =
        this.toMinutes(
          minuteSubtract[2]
        );

      if (
        base !== null
      ) {
        const resultTime =
          this.formatMinutes(
            base - amount
          );

        return this.result(
          "time-subtract-minutes",
          "single-value",
          resultTime,
          {
            base:
              minuteSubtract[2],
            minutes:
              amount,
            result:
              resultTime
          },
          `${minuteSubtract[2]} minus ${amount} minutes is ${resultTime}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Money
    // ---------------------------------------------------------

    if (
      /£|pounds?|money|cost|price|spend|change/i.test(
        normalized
      )
    ) {
      const amounts = [
        ...normalized.matchAll(
          /£\s*(\d+(?:\.\d{1,2})?)/gi
        )
      ].map(
        match =>
          Number(
            match[1]
          )
      );

      if (
        amounts.length >= 2 &&
        /total|altogether|cost|spend|pay|price/i.test(
          normalized
        )
      ) {
        const total =
          amounts.reduce(
            (
              sum,
              value
            ) =>
              sum + value,
            0
          );

        return this.result(
          "money-total",
          "single-value",
          this.roundNumber(
            total,
            2
          ),
          {
            amounts,
            total
          },
          `The total cost is £${this.roundNumber(
            total,
            2
          )}.`
        );
      }

      const priceAndPaid =
        normalized.match(
          /£\s*(\d+(?:\.\d{1,2})?).*?(?:pay|paid|gave|hands over).*?£\s*(\d+(?:\.\d{1,2})?)/i
        );

      if (
        priceAndPaid
      ) {
        const price =
          Number(
            priceAndPaid[1]
          );

        const paid =
          Number(
            priceAndPaid[2]
          );

        const change =
          paid - price;

        if (
          change >= 0
        ) {
          return this.result(
            "money-change",
            "single-value",
            this.roundNumber(
              change,
              2
            ),
            {
              price,
              paid,
              change
            },
            `The change is £${this.roundNumber(
              change,
              2
            )}.`
          );
        }
      }
    }

    return null;
  }

  // ===========================================================
  // TRAIN TIMETABLE SOLVER
  // ===========================================================

  solveTrainTimetable(
    visualData
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    const departureStation =
      structured.departure_station ??
      structured.departureStation ??
      null;

    const departureTime =
      structured.departure_time ??
      structured.departureTime ??
      null;

    const destination =
      structured.destination ??
      null;

    const tables =
      Array.isArray(
        structured.tables
      )
        ? structured.tables
        : [];

    if (
      !departureStation ||
      !departureTime ||
      !destination ||
      tables.length === 0
    ) {
      return null;
    }

    const departureMinutes =
      this.toMinutes(
        departureTime
      );

    if (
      departureMinutes === null
    ) {
      return null;
    }

    const services = [];

    const walk =
      value => {
        if (!value) {
          return;
        }

        if (
          Array.isArray(
            value
          )
        ) {
          for (
            const item of value
          ) {
            walk(item);
          }

          return;
        }

        if (
          typeof value !==
          "object"
        ) {
          return;
        }

        if (
          value[
            departureStation
          ] !== undefined &&
          value[
            destination
          ] !== undefined
        ) {
          services.push(
            value
          );
        }

        for (
          const key of [
            "rows",
            "services",
            "entries",
            "times",
            "trains"
          ]
        ) {
          if (
            value[key] !==
            undefined
          ) {
            walk(
              value[key]
            );
          }
        }
      };

    walk(
      tables
    );

    let best =
      null;

    for (
      const service of
        services
    ) {
      const from =
        this.toMinutes(
          service[
            departureStation
          ]
        );

      let to =
        this.toMinutes(
          service[
            destination
          ]
        );

      if (
        from === null ||
        to === null
      ) {
        continue;
      }

      if (
        from <
        departureMinutes
      ) {
        continue;
      }

      if (
        to <
        from
      ) {
        to +=
          1440;
      }

      const duration =
        to - from;

      if (
        duration < 0
      ) {
        continue;
      }

      if (
        !best ||
        from <
        best.from
      ) {
        best = {
          from,
          to,
          duration,
          service
        };
      }
    }

    if (
      !best
    ) {
      return null;
    }

    const hours =
      Math.floor(
        best.duration /
        60
      );

    const minutes =
      best.duration %
      60;

    return this.result(
      "timetable-analysis",
      "multi-value",
      {
        journey: {
          departureStation,
          departureTime:
            this.formatMinutes(
              best.from
            ),
          destination,
          arrivalTime:
            this.formatMinutes(
              best.to
            )
        },

        duration: {
          hours,
          minutes,
          totalMinutes:
            best.duration
        }
      },
      {
        departureStation,
        departureTime,
        destination,
        durationMinutes:
          best.duration,
        service:
          best.service
      },
      `Travel from ${departureStation} at ${this.formatMinutes(
        best.from
      )} to ${destination}. The journey takes ${hours} hours and ${minutes} minutes.`
    );
  }

  // ===========================================================
  // TIME CONVERSION HELPERS
  // ===========================================================

  toMinutes(
    value
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    const text =
      String(value)
        .trim()
        .replace(
          /\./g,
          ":"
        );

    const match =
      text.match(
        /^(\d{1,2}):(\d{2})$/
      );

    if (
      !match
    ) {
      return null;
    }

    const hours =
      Number(
        match[1]
      );

    const minutes =
      Number(
        match[2]
      );

    if (
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return (
      hours * 60 +
      minutes
    );
  }

  formatMinutes(
    value
  ) {
    const total =
      (
        (
          Number(value) %
          1440
        ) +
        1440
      ) %
      1440;

    const hours =
      Math.floor(
        total / 60
      );

    const minutes =
      total % 60;

    return (
      `${String(
        hours
      ).padStart(2, "0")}:` +
      `${String(
        minutes
      ).padStart(2, "0")}`
    );
  }

  // ===========================================================
  // GEOMETRY / AREA / PERIMETER / VOLUME
  // ===========================================================

  solveGeometry(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    const shape =
      String(
        structured.shape ??
        visualData?.questionType ??
        ""
      ).toLowerCase();

    const dimensions =
      structured.dimensions ??
      {};

    if (
      visualData?.questionType !==
        "geometry" &&
      !/area|perimeter|volume|surface area|shape|triangle|rectangle|square|circle|polygon|trapez|cuboid|prism|cylinder|cone|sphere/i.test(
        normalized
      )
    ) {
      return null;
    }

    // ---------------------------------------------------------
    // Direct Gemini calculations
    // ---------------------------------------------------------

    const directValues = [
      [
        "surface area",
        "calculatedSurfaceArea",
        "geometry-surface-area"
      ],
      [
        "perimeter",
        "calculatedPerimeter",
        "geometry-perimeter"
      ],
      [
        "volume",
        "calculatedVolume",
        "geometry-volume"
      ],
      [
        "area",
        "calculatedArea",
        "geometry-area"
      ],
      [
        "value",
        "calculatedValue",
        "geometry-calculated-value"
      ]
    ];

    for (
      const [
        name,
        key,
        method
      ] of directValues
    ) {
      if (
        (
          name === "value" ||
          normalized.toLowerCase().includes(
            name
          )
        ) &&
        Number.isFinite(
          Number(
            structured[key]
          )
        )
      ) {
        const value =
          Number(
            structured[key]
          );

        return this.result(
          method,
          "single-value",
          value,
          structured,
          `The calculated answer is ${value}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Rectangle
    // ---------------------------------------------------------

    if (
      /rectangle|rectangular/i.test(
        shape
      ) ||
      /rectangle/i.test(
        normalized
      )
    ) {
      const length =
        this.firstFinite(
          dimensions.length,
          dimensions.width,
          dimensions.base,
          structured.length,
          structured.width,
          structured.base,
          structured.sideLengths?.[0]
        );

      const width =
        this.firstFinite(
          dimensions.width,
          dimensions.height,
          structured.width,
          structured.height,
          structured.sideLengths?.[1]
        );

      if (
        length !== null &&
        width !== null
      ) {
        if (
          /perimeter/i.test(
            normalized
          )
        ) {
          const perimeter =
            2 *
            (
              length +
              width
            );

          return this.result(
            "rectangle-perimeter",
            "single-value",
            perimeter,
            {
              length,
              width
            },
            `The perimeter is ${perimeter}.`
          );
        }

        if (
          /area/i.test(
            normalized
          )
        ) {
          const area =
            length *
            width;

          return this.result(
            "rectangle-area",
            "single-value",
            area,
            {
              length,
              width
            },
            `The area is ${area}.`
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Square
    // ---------------------------------------------------------

    if (
      /square/i.test(
        shape
      ) ||
      /\bsquare\b/i.test(
        normalized
      )
    ) {
      const side =
        this.firstFinite(
          dimensions.side,
          dimensions.length,
          structured.side,
          structured.length,
          structured.sideLength,
          structured.sideLengths?.[0]
        );

      if (
        side !== null
      ) {
        if (
          /perimeter/i.test(
            normalized
          )
        ) {
          return this.result(
            "square-perimeter",
            "single-value",
            4 * side,
            { side },
            `The perimeter is ${4 * side}.`
          );
        }

        if (
          /area/i.test(
            normalized
          )
        ) {
          return this.result(
            "square-area",
            "single-value",
            side * side,
            { side },
            `The area is ${side * side}.`
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Triangle
    // ---------------------------------------------------------

    if (
      /triangle/i.test(
        shape
      ) ||
      /\btriangle\b/i.test(
        normalized
      )
    ) {
      const base =
        this.firstFinite(
          dimensions.base,
          dimensions.baseLength,
          dimensions.length,
          structured.base,
          structured.baseLength
        );

      const height =
        this.firstFinite(
          dimensions.height,
          structured.height
        );

      if (
        base !== null &&
        height !== null &&
        /area/i.test(
          normalized
        )
      ) {
        const area =
          0.5 *
          base *
          height;

        return this.result(
          "triangle-area",
          "single-value",
          area,
          {
            base,
            height
          },
          `The triangle area is ${area}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Trapezium / trapezoid
    // ---------------------------------------------------------

    if (
      /trapez/i.test(
        shape
      ) ||
      /trapez/i.test(
        normalized
      )
    ) {
      const a =
        this.firstFinite(
          dimensions.base1,
          dimensions.top,
          dimensions.upperBase,
          structured.base1
        );

      const b =
        this.firstFinite(
          dimensions.base2,
          dimensions.bottom,
          dimensions.lowerBase,
          structured.base2
        );

      const height =
        this.firstFinite(
          dimensions.height,
          structured.height
        );

      if (
        a !== null &&
        b !== null &&
        height !== null &&
        /area/i.test(
          normalized
        )
      ) {
        const area =
          (
            (a + b) /
            2
          ) *
          height;

        return this.result(
          "trapezium-area",
          "single-value",
          area,
          {
            a,
            b,
            height
          },
          `The trapezium area is ${area}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Circle
    // ---------------------------------------------------------

    if (
      /circle/i.test(
        shape
      ) ||
      /\bcircle\b/i.test(
        normalized
      )
    ) {
      const radius =
        this.firstFinite(
          dimensions.radius,
          structured.radius
        );

      const diameter =
        this.firstFinite(
          dimensions.diameter,
          structured.diameter
        );

      const actualRadius =
        radius !== null
          ? radius
          : diameter !== null
            ? diameter / 2
            : null;

      if (
        actualRadius !== null
      ) {
        if (
          /circumference/i.test(
            normalized
          )
        ) {
          const circumference =
            2 *
            Math.PI *
            actualRadius;

          return this.result(
            "circle-circumference",
            "single-value",
            this.roundNumber(
              circumference
            ),
            {
              radius:
                actualRadius
            },
            `The circumference is approximately ${this.roundNumber(
              circumference
            )}.`
          );
        }

        if (
          /area/i.test(
            normalized
          )
        ) {
          const area =
            Math.PI *
            actualRadius *
            actualRadius;

          return this.result(
            "circle-area",
            "single-value",
            this.roundNumber(
              area
            ),
            {
              radius:
                actualRadius
            },
            `The area is approximately ${this.roundNumber(
              area
            )}.`
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Cuboid / rectangular prism
    // ---------------------------------------------------------

    if (
      /cuboid|rectangular prism/i.test(
        shape
      ) ||
      /cuboid|rectangular prism/i.test(
        normalized
      )
    ) {
      const length =
        this.firstFinite(
          dimensions.length,
          structured.length
        );

      const width =
        this.firstFinite(
          dimensions.width,
          structured.width
        );

      const height =
        this.firstFinite(
          dimensions.height,
          structured.height
        );

      if (
        length !== null &&
        width !== null &&
        height !== null
      ) {
        if (
          /surface area/i.test(
            normalized
          )
        ) {
          const surfaceArea =
            2 *
            (
              length * width +
              length * height +
              width * height
            );

          return this.result(
            "cuboid-surface-area",
            "single-value",
            surfaceArea,
            {
              length,
              width,
              height
            },
            `The surface area is ${surfaceArea}.`
          );
        }

        if (
          /volume/i.test(
            normalized
          )
        ) {
          const volume =
            length *
            width *
            height;

          return this.result(
            "cuboid-volume",
            "single-value",
            volume,
            {
              length,
              width,
              height
            },
            `The volume is ${volume}.`
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Cube
    // ---------------------------------------------------------

    if (
      /\bcube\b/i.test(
        shape
      ) ||
      /\bcube\b/i.test(
        normalized
      )
    ) {
      const side =
        this.firstFinite(
          dimensions.side,
          dimensions.length,
          structured.side,
          structured.length
        );

      if (
        side !== null
      ) {
        if (
          /surface area/i.test(
            normalized
          )
        ) {
          const surfaceArea =
            6 *
            side *
            side;

          return this.result(
            "cube-surface-area",
            "single-value",
            surfaceArea,
            {
              side
            },
            `The cube surface area is ${surfaceArea}.`
          );
        }

        if (
          /volume/i.test(
            normalized
          )
        ) {
          const volume =
            side *
            side *
            side;

          return this.result(
            "cube-volume",
            "single-value",
            volume,
            {
              side
            },
            `The cube volume is ${volume}.`
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Cylinder
    // ---------------------------------------------------------

    if (
      /cylinder/i.test(
        shape
      ) ||
      /\bcylinder\b/i.test(
        normalized
      )
    ) {
      const radius =
        this.firstFinite(
          dimensions.radius,
          structured.radius
        );

      const height =
        this.firstFinite(
          dimensions.height,
          structured.height
        );

      if (
        radius !== null &&
        height !== null
      ) {
        if (
          /volume/i.test(
            normalized
          )
        ) {
          const volume =
            Math.PI *
            radius *
            radius *
            height;

          return this.result(
            "cylinder-volume",
            "single-value",
            this.roundNumber(
              volume
            ),
            {
              radius,
              height
            },
            `The cylinder volume is approximately ${this.roundNumber(
              volume
            )}.`
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Compound / L-shaped shape
    // ---------------------------------------------------------

    if (
      /compound|l-shape|l shaped|irregular polygon/i.test(
        shape
      ) ||
      /compound shape|l-shape|l shaped|irregular polygon/i.test(
        normalized
      )
    ) {
      if (
        Number.isFinite(
          Number(
            structured.calculatedArea
          )
        )
      ) {
        const area =
          Number(
            structured.calculatedArea
          );

        return this.result(
          "compound-shape-area",
          "single-value",
          area,
          structured,
          `The compound shape area is ${area}.`
        );
      }
    }

    return null;
  }

  // ===========================================================
  // PROBABILITY
  // ===========================================================

  solveProbability(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    if (
      !/probability|chance|likelihood|random/i.test(
        normalized
      )
    ) {
      return null;
    }

    const favorable =
      this.firstFinite(
        structured.favorable,
        structured.successes,
        structured.desired,
        structured.success,
        structured.favourable
      );

    const total =
      this.firstFinite(
        structured.total,
        structured.outcomes,
        structured.possible,
        structured.totalOutcomes
      );

    if (
      favorable !== null &&
      total !== null &&
      total !== 0
    ) {
      const probability =
        favorable /
        total;

      return this.result(
        "probability",
        "single-value",
        this.roundNumber(
          probability
        ),
        {
          favorable,
          total,
          fraction:
            `${favorable}/${total}`,
          probability
        },
        `The probability is ${favorable}/${total}.`
      );
    }

    // ---------------------------------------------------------
    // Probability from frequency table
    // ---------------------------------------------------------

    const frequencyTable =
      structured.frequencyTable ??
      structured.frequencies ??
      null;

    if (
      Array.isArray(
        frequencyTable
      )
    ) {
      const rows =
        frequencyTable
          .map(
            row => ({
              value:
                row?.value ??
                row?.label,

              frequency:
                Number(
                  row?.frequency ??
                  row?.count ??
                  row?.f
                )
            })
          )
          .filter(
            row =>
              Number.isFinite(
                Number(
                  row.value
                )
              ) &&
              Number.isFinite(
                row.frequency
              )
          );

      const totalFrequency =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            row.frequency,
          0
        );

      if (
        totalFrequency >
        0
      ) {
        const target =
          structured.targetValue ??
          structured.eventValue;

        if (
          target !==
            undefined &&
          target !==
            null
        ) {
          const row =
            rows.find(
              item =>
                String(
                  item.value
                ) ===
                String(
                  target
                )
            );

          if (
            row
          ) {
            const probability =
              row.frequency /
              totalFrequency;

            return this.result(
              "probability-frequency",
              "single-value",
              this.roundNumber(
                probability
              ),
              {
                target,
                frequency:
                  row.frequency,
                totalFrequency,
                probability
              },
              `The probability is ${row.frequency}/${totalFrequency}.`
            );
          }
        }
      }
    }

    return null;
  }

  // ===========================================================
  // FRACTIONS / PERCENTAGES / RATIO
  // ===========================================================

  solveFractionPercentageRatio(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Explicit fraction result
    // ---------------------------------------------------------

    if (
      structured.answerFraction
    ) {
      const fraction =
        this.parseFraction(
          structured.answerFraction
        );

      if (
        fraction
      ) {
        return this.result(
          "fraction-direct",
          "fraction",
          `${fraction.numerator}/${fraction.denominator}`,
          {
            fraction
          },
          `The answer is ${fraction.numerator}/${fraction.denominator}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Equivalent fractions
    // ---------------------------------------------------------

    if (
      structured.operation ===
      "find_equivalent_fraction"
    ) {
      const value =
        String(
          structured.value ??
          structured.fraction ??
          ""
        ).trim();

      const cards =
        Array.isArray(
          visualData?.numbers
        )
          ? visualData.numbers
          : [];

      const fraction =
        this.parseFraction(
          value
        );

      if (
        fraction &&
        cards.length > 0
      ) {
        const pair =
          this.findEquivalentFractionCards(
            fraction.numerator,
            fraction.denominator,
            cards
          );

        if (
          pair
        ) {
          return {
            success: true,

            method:
              "equivalent-fraction",

            answerModel:
              "fill_in_the_blank",

            answers: {
              numerator:
                pair.numerator,

              denominator:
                pair.denominator,

              value:
                `${pair.numerator}/${pair.denominator}`
            },

            analysis: {
              original:
                value,

              cards,

              multiplier:
                pair.multiplier
            },

            explanation:
              `${pair.numerator}/${pair.denominator} is equivalent to ${value}.`
          };
        }
      }
    }

    // ---------------------------------------------------------
    // Fraction arithmetic
    // ---------------------------------------------------------

    const fractionExpression =
      normalized.match(
        /(-?\d+)\s*\/\s*(-?\d+)\s*([+\-*/])\s*(-?\d+)\s*\/\s*(-?\d+)/
      );

    if (
      fractionExpression
    ) {
      const a =
        Number(
          fractionExpression[1]
        );

      const b =
        Number(
          fractionExpression[2]
        );

      const operator =
        fractionExpression[3];

      const c =
        Number(
          fractionExpression[4]
        );

      const d =
        Number(
          fractionExpression[5]
        );

      if (
        b === 0 ||
        d === 0
      ) {
        return null;
      }

      let numerator;
      let denominator;

      if (
        operator === "+"
      ) {
        numerator =
          a * d +
          c * b;

        denominator =
          b * d;
      } else if (
        operator === "-"
      ) {
        numerator =
          a * d -
          c * b;

        denominator =
          b * d;
      } else if (
        operator === "*"
      ) {
        numerator =
          a * c;

        denominator =
          b * d;
      } else if (
        operator === "/"
      ) {
        if (
          c === 0
        ) {
          return null;
        }

        numerator =
          a * d;

        denominator =
          b * c;
      } else {
        return null;
      }

      const simplified =
        this.simplifyFraction(
          numerator,
          denominator
        );

      return this.result(
        "fraction-arithmetic",
        "fraction",
        `${simplified.numerator}/${simplified.denominator}`,
        {
          numerator,
          denominator,
          simplified,
          operator
        },
        `The answer is ${simplified.numerator}/${simplified.denominator}.`
      );
    }

    // ---------------------------------------------------------
    // Percentage of amount
    // ---------------------------------------------------------

    const percentageOf =
      normalized.match(
        /(\d+(?:\.\d+)?)\s*%\s*(?:of|times)\s*(\d+(?:\.\d+)?)/i
      );

    if (
      percentageOf
    ) {
      const percent =
        Number(
          percentageOf[1]
        );

      const amount =
        Number(
          percentageOf[2]
        );

      const value =
        (
          percent *
          amount
        ) /
        100;

      return this.result(
        "percentage-of",
        "single-value",
        value,
        {
          percent,
          amount,
          value
        },
        `${percent}% of ${amount} is ${value}.`
      );
    }

    // ---------------------------------------------------------
    // Decimal to percentage
    // ---------------------------------------------------------

    const decimalToPercent =
      normalized.match(
        /(?:convert|write|express)\s+(\d+(?:\.\d+)?)\s+(?:as|to|into)\s+(?:a\s+)?percentage/i
      );

    if (
      decimalToPercent
    ) {
      const decimal =
        Number(
          decimalToPercent[1]
        );

      const percentage =
        decimal *
        100;

      return this.result(
        "decimal-to-percentage",
        "single-value",
        percentage,
        {
          decimal,
          percentage
        },
        `${decimal} is ${percentage}%.`
      );
    }

    // ---------------------------------------------------------
    // Percentage to decimal
    // ---------------------------------------------------------

    const percentToDecimal =
      normalized.match(
        /(?:convert|write|express)\s+(\d+(?:\.\d+)?)\s*%\s+(?:as|to|into)\s+(?:a\s+)?decimal/i
      );

    if (
      percentToDecimal
    ) {
      const percentage =
        Number(
          percentToDecimal[1]
        );

      const decimal =
        percentage /
        100;

      return this.result(
        "percentage-to-decimal",
        "single-value",
        decimal,
        {
          percentage,
          decimal
        },
        `${percentage}% is ${decimal} as a decimal.`
      );
    }

    // ---------------------------------------------------------
    // Fraction to decimal
    // ---------------------------------------------------------

    const fractionToDecimal =
      normalized.match(
        /(?:convert|write|express)\s+(-?\d+)\s*\/\s*(-?\d+)\s+(?:as|to|into)\s+(?:a\s+)?decimal/i
      );

    if (
      fractionToDecimal
    ) {
      const numerator =
        Number(
          fractionToDecimal[1]
        );

      const denominator =
        Number(
          fractionToDecimal[2]
        );

      if (
        denominator !== 0
      ) {
        const value =
          numerator /
          denominator;

        return this.result(
          "fraction-to-decimal",
          "single-value",
          this.roundNumber(
            value
          ),
          {
            numerator,
            denominator,
            value
          },
          `${numerator}/${denominator} = ${this.roundNumber(
            value
          )}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Percentage change
    // ---------------------------------------------------------

    const percentageChange =
      normalized.match(
        /(?:percentage\s+)?(?:increase|decrease|change)\s+from\s+(\d+(?:\.\d+)?)\s+(?:to|into)\s+(\d+(?:\.\d+)?)/i
      );

    if (
      percentageChange
    ) {
      const oldValue =
        Number(
          percentageChange[1]
        );

      const newValue =
        Number(
          percentageChange[2]
        );

      if (
        oldValue !== 0
      ) {
        const percentage =
          (
            (
              newValue -
              oldValue
            ) /
            oldValue
          ) *
          100;

        return this.result(
          "percentage-change",
          "single-value",
          this.roundNumber(
            percentage
          ),
          {
            oldValue,
            newValue,
            percentage
          },
          `The percentage change is ${this.roundNumber(
            percentage
          )}%.`
        );
      }
    }

    // ---------------------------------------------------------
    // Ratio simplification
    // ---------------------------------------------------------

    const ratioMatch =
      normalized.match(
        /ratio[^0-9]*?(\d+)\s*:\s*(\d+)/i
      );

    if (
      ratioMatch &&
      /ratio|proportion|share/i.test(
        normalized
      )
    ) {
      const a =
        Number(
          ratioMatch[1]
        );

      const b =
        Number(
          ratioMatch[2]
        );

      const divisor =
        this.gcd(
          a,
          b
        );

      const simplified =
        `${a / divisor}:${b / divisor}`;

      return this.result(
        "ratio-simplify",
        "ratio",
        simplified,
        {
          original:
            `${a}:${b}`,
          simplified
        },
        `The simplified ratio is ${simplified}.`
      );
    }

    // ---------------------------------------------------------
    // Ratio / proportion
    // ---------------------------------------------------------

    const proportion =
      structured.proportion ??
      structured.ratioValues ??
      null;

    if (
      proportion &&
      typeof proportion ===
        "object"
    ) {
      const known =
        this.firstFinite(
          proportion.known,
          proportion.knownValue
        );

      const knownRatio =
        this.firstFinite(
          proportion.knownRatio,
          proportion.ratioKnown
        );

      const targetRatio =
        this.firstFinite(
          proportion.targetRatio,
          proportion.ratioTarget
        );

      if (
        known !== null &&
        knownRatio !== null &&
        targetRatio !== null &&
        knownRatio !== 0
      ) {
        const answer =
          (
            known /
            knownRatio
          ) *
          targetRatio;

        return this.result(
          "proportion",
          "single-value",
          this.roundNumber(
            answer
          ),
          {
            known,
            knownRatio,
            targetRatio,
            answer
          },
          `The proportional value is ${this.roundNumber(
            answer
          )}.`
        );
      }
    }

    return null;
  }

  // ===========================================================
  // UNIT CONVERSION / RATES / COMPOUND MEASURES
  // ===========================================================

  solveUnitsRates(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Structured conversion
    // ---------------------------------------------------------

    if (
      structured.fromValue !==
        undefined &&
      structured.fromUnit &&
      structured.toUnit
    ) {
      const value =
        this.convertUnit(
          Number(
            structured.fromValue
          ),
          structured.fromUnit,
          structured.toUnit
        );

      if (
        value !== null
      ) {
        return this.result(
          "unit-conversion",
          "single-value",
          this.roundNumber(
            value
          ),
          {
            value:
              structured.fromValue,
            from:
              structured.fromUnit,
            to:
              structured.toUnit,
            result:
              value
          },
          `${structured.fromValue} ${structured.fromUnit} = ${this.roundNumber(
            value
          )} ${structured.toUnit}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Text unit conversion
    // ---------------------------------------------------------

    const conversion =
      normalized.match(
        /(?:convert|how many|equivalent(?:\s+to)?)\s+(\d+(?:\.\d+)?)\s*(mm|cm|m|km|g|kg|mg|ml|l|seconds?|minutes?|hours?|inches?|feet|ft|yards?|miles?)\s*(?:to|into|in)\s*(mm|cm|m|km|mg|g|kg|ml|l|seconds?|minutes?|hours?|inches?|feet|ft|yards?|miles?)/i
      );

    if (
      conversion
    ) {
      const value =
        Number(
          conversion[1]
        );

      const from =
        conversion[2];

      const to =
        conversion[3];

      const converted =
        this.convertUnit(
          value,
          from,
          to
        );

      if (
        converted !== null
      ) {
        return this.result(
          "unit-conversion",
          "single-value",
          this.roundNumber(
            converted
          ),
          {
            value,
            from,
            to,
            converted
          },
          `${value} ${from} = ${this.roundNumber(
            converted
          )} ${to}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Speed / rate
    // ---------------------------------------------------------

    const speedMatch =
      normalized.match(
        /(\d+(?:\.\d+)?)\s*(km|kilometres?|kilometers?|miles?|m)\s*(?:in|per|\/)\s*(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?|s)\b/i
      );

    if (
      speedMatch
    ) {
      const distance =
        Number(
          speedMatch[1]
        );

      const distanceUnit =
        speedMatch[2];

      const time =
        Number(
          speedMatch[3]
        );

      const timeUnit =
        speedMatch[4]
          .toLowerCase();

      let hours =
        time;

      if (
        /min/.test(
          timeUnit
        )
      ) {
        hours =
          time /
          60;
      } else if (
        /sec|^s$/.test(
          timeUnit
        )
      ) {
        hours =
          time /
          3600;
      }

      if (
        hours >
        0
      ) {
        const speed =
          distance /
          hours;

        return this.result(
          "rate-speed",
          "single-value",
          this.roundNumber(
            speed
          ),
          {
            distance,
            distanceUnit,
            time,
            timeUnit,
            hours,
            speed
          },
          `The speed is ${this.roundNumber(
            speed
          )} ${distanceUnit} per hour.`
        );
      }
    }

    // ---------------------------------------------------------
    // Generic distance = rate × time
    // ---------------------------------------------------------

    if (
      structured.rate !==
        undefined &&
      structured.time !==
        undefined &&
      /distance|how far/i.test(
        normalized
      )
    ) {
      const rate =
        Number(
          structured.rate
        );

      const time =
        Number(
          structured.time
        );

      if (
        Number.isFinite(rate) &&
        Number.isFinite(time)
      ) {
        const distance =
          rate *
          time;

        return this.result(
          "distance-from-rate",
          "single-value",
          distance,
          {
            rate,
            time,
            distance
          },
          `The distance is ${distance}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Compound measures
    // ---------------------------------------------------------

    if (
      /density/i.test(
        normalized
      )
    ) {
      const mass =
        this.firstFinite(
          structured.mass
        );

      const volume =
        this.firstFinite(
          structured.volume
        );

      if (
        mass !== null &&
        volume !== null &&
        volume !== 0
      ) {
        const density =
          mass /
          volume;

        return this.result(
          "density",
          "single-value",
          density,
          {
            mass,
            volume,
            density
          },
          `The density is ${density}.`
        );
      }
    }

    if (
      /pressure/i.test(
        normalized
      )
    ) {
      const force =
        this.firstFinite(
          structured.force
        );

      const area =
        this.firstFinite(
          structured.area
        );

      if (
        force !== null &&
        area !== null &&
        area !== 0
      ) {
        const pressure =
          force /
          area;

        return this.result(
          "pressure",
          "single-value",
          pressure,
          {
            force,
            area,
            pressure
          },
          `The pressure is ${pressure}.`
        );
      }
    }

    return null;
  }

  // ===========================================================
  // UNIT CONVERSION
  // ===========================================================

  convertUnit(
    value,
    from,
    to
  ) {
    if (
      !Number.isFinite(
        value
      ) ||
      !from ||
      !to
    ) {
      return null;
    }

    const normalize =
      unit =>
        String(
          unit
        )
          .toLowerCase()
          .replace(
            /\s+/g,
            ""
          );

    const a =
      normalize(
        from
      );

    const b =
      normalize(
        to
      );

    // ---------------------------------------------------------
    // Length
    // ---------------------------------------------------------

    const lengthUnits = {
      mm:
        0.001,

      millimetre:
        0.001,

      millimetres:
        0.001,

      millimeter:
        0.001,

      millimeters:
        0.001,

      cm:
        0.01,

      centimetre:
        0.01,

      centimetres:
        0.01,

      centimeter:
        0.01,

      centimeters:
        0.01,

      m:
        1,

      metre:
        1,

      metres:
        1,

      meter:
        1,

      meters:
        1,

      km:
        1000,

      kilometre:
        1000,

      kilometres:
        1000,

      kilometer:
        1000,

      kilometers:
        1000,

      in:
        0.0254,

      inch:
        0.0254,

      inches:
        0.0254,

      ft:
        0.3048,

      foot:
        0.3048,

      feet:
        0.3048,

      yd:
        0.9144,

      yard:
        0.9144,

      yards:
        0.9144,

      mile:
        1609.344,

      miles:
        1609.344
    };

    if (
      lengthUnits[a] !==
        undefined &&
      lengthUnits[b] !==
        undefined
    ) {
      return (
        value *
        lengthUnits[a] /
        lengthUnits[b]
      );
    }

    // ---------------------------------------------------------
    // Mass
    // ---------------------------------------------------------

    const massUnits = {
      mg:
        0.001,

      milligram:
        0.001,

      milligrams:
        0.001,

      g:
        1,

      gram:
        1,

      grams:
        1,

      kg:
        1000,

      kilogram:
        1000,

      kilograms:
        1000
    };

    if (
      massUnits[a] !==
        undefined &&
      massUnits[b] !==
        undefined
    ) {
      return (
        value *
        massUnits[a] /
        massUnits[b]
      );
    }

    // ---------------------------------------------------------
    // Volume
    // ---------------------------------------------------------

    const volumeUnits = {
      ml:
        1,

      millilitre:
        1,

      millilitres:
        1,

      l:
        1000,

      litre:
        1000,

      litres:
        1000
    };

    if (
      volumeUnits[a] !==
        undefined &&
      volumeUnits[b] !==
        undefined
    ) {
      return (
        value *
        volumeUnits[a] /
        volumeUnits[b]
      );
    }

    // ---------------------------------------------------------
    // Time
    // ---------------------------------------------------------

    const timeUnits = {
      ms:
        0.001,

      millisecond:
        0.001,

      milliseconds:
        0.001,

      s:
        1,

      sec:
        1,

      secs:
        1,

      second:
        1,

      seconds:
        1,

      min:
        60,

      mins:
        60,

      minute:
        60,

      minutes:
        60,

      h:
        3600,

      hr:
        3600,

      hrs:
        3600,

      hour:
        3600,

      hours:
        3600
    };

    if (
      timeUnits[a] !==
        undefined &&
      timeUnits[b] !==
        undefined
    ) {
      return (
        value *
        timeUnits[a] /
        timeUnits[b]
      );
    }

    // ---------------------------------------------------------
    // Currency-like percentage conversion is intentionally
    // handled separately by the percentage solver.
    // ---------------------------------------------------------

    return null;
  }

    // ===========================================================
  // SEQUENCES / PATTERNS
  // ===========================================================

  solveSequence(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Rule supplied by Gemini
    // ---------------------------------------------------------

    const rule =
      String(
        structured.rule ??
        structured.formula ??
        structured.equation ??
        ""
      )
        .trim();

    let termNumber =
      this.firstFinite(
        structured.termNumber,
        structured.requestedTerm,
        structured.n
      );

    // Try to get requested term from the question.
    if (
      termNumber === null
    ) {
      const match =
        normalized.match(
          /(?:work\s*out|find|calculate|what\s+is)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?\s*term/i
        );

      if (
        match
      ) {
        termNumber =
          Number(
            match[1]
          );
      }
    }

    // ---------------------------------------------------------
    // Explicit sequence formula
    // ---------------------------------------------------------

    if (
      rule &&
      termNumber !== null
    ) {
      const expression =
        String(rule)
          .replace(
            /^.*?(?:T\s*\(\s*n\s*\)|Tn?|a[_\s]?n)\s*=\s*/i,
            ""
          )
          .replace(
            /\s+/g,
            ""
          )
          .replace(
            /²/g,
            "^2"
          )
          .replace(
            /³/g,
            "^3"
          );

      const value =
        this.evaluateExpressionAtN(
          expression,
          termNumber
        );

      if (
        value !== null
      ) {
        return this.result(
          "sequence-term",
          "single-value",
          value,
          {
            rule:
              expression,
            termNumber,
            value
          },
          `Substituting n = ${termNumber} gives ${value}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Explicit arithmetic sequence
    // ---------------------------------------------------------

    const terms =
      this.extractNumericArray(
        structured.terms ??
        structured.sequence ??
        structured.sequenceValues
      );

    if (
      terms.length >= 2 &&
      /sequence|pattern|next\s+(?:term|number|value)/i.test(
        normalized
      )
    ) {
      // Constant differences
      const differences =
        terms
          .slice(1)
          .map(
            (
              value,
              index
            ) =>
              value -
              terms[index]
          );

      const arithmetic =
        differences.length > 0 &&
        differences.every(
          difference =>
            this.nearlyEqual(
              difference,
              differences[0]
            )
        );

      if (
        arithmetic
      ) {
        const next =
          terms[
            terms.length - 1
          ] +
          differences[0];

        return this.result(
          "arithmetic-sequence-next-term",
          "single-value",
          next,
          {
            terms,
            difference:
              differences[0],
            next
          },
          `The next term is ${next}.`
        );
      }

      // Constant ratios
      if (
        terms.every(
          value =>
            value !== 0
        )
      ) {
        const ratios =
          terms
            .slice(1)
            .map(
              (
                value,
                index
              ) =>
                value /
                terms[index]
            );

        const geometric =
          ratios.every(
            ratio =>
              Number.isFinite(
                ratio
              ) &&
              this.nearlyEqual(
                ratio,
                ratios[0]
              )
          );

        if (
          geometric
        ) {
          const next =
            terms[
              terms.length - 1
            ] *
            ratios[0];

          return this.result(
            "geometric-sequence-next-term",
            "single-value",
            next,
            {
              terms,
              ratio:
                ratios[0],
              next
            },
            `The next term is ${next}.`
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Second-difference quadratic sequence
    // ---------------------------------------------------------

    if (
      terms.length >= 4 &&
      /sequence|pattern|next\s+(?:term|number|value)/i.test(
        normalized
      )
    ) {
      const firstDifferences =
        terms
          .slice(1)
          .map(
            (
              value,
              index
            ) =>
              value -
              terms[index]
          );

      const secondDifferences =
        firstDifferences
          .slice(1)
          .map(
            (
              value,
              index
            ) =>
              value -
              firstDifferences[
                index
              ]
          );

      if (
        secondDifferences.length > 0 &&
        secondDifferences.every(
          difference =>
            this.nearlyEqual(
              difference,
              secondDifferences[0]
            )
        )
      ) {
        const nextDifference =
          firstDifferences[
            firstDifferences.length - 1
          ] +
          secondDifferences[0];

        const next =
          terms[
            terms.length - 1
          ] +
          nextDifference;

        return this.result(
          "quadratic-sequence-next-term",
          "single-value",
          next,
          {
            terms,
            firstDifferences,
            secondDifferences,
            nextDifference,
            next
          },
          `The next term is ${next}.`
        );
      }
    }

    return null;
  }

  evaluateExpressionAtN(
    expression,
    n
  ) {
    if (
      !expression ||
      !Number.isFinite(
        Number(n)
      )
    ) {
      return null;
    }

    let safe =
      String(expression)
        .replace(
          /²/g,
          "^2"
        )
        .replace(
          /³/g,
          "^3"
        )
        .replace(
          /\bn\b/gi,
          `(${Number(n)})`
        );

    // Convert common power forms into JavaScript exponentiation.
    safe =
      safe.replace(
        /\^/g,
        "**"
      );

    // Basic implicit multiplication:
    // 2n -> 2*n
    // 3(n+1) -> 3*(n+1)
    safe =
      safe.replace(
        /(\d|\))\s*\(/g,
        "$1*("
      );

    // At this stage only numeric arithmetic should remain.
    if (
      /[a-z]/i.test(
        safe
      )
    ) {
      return null;
    }

    return this.safeArithmetic(
      safe
    );
  }

  // ===========================================================
  // ALGEBRA
  // ===========================================================

  solveAlgebra(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Direct structured expression + values
    // ---------------------------------------------------------

    if (
      structured.expression &&
      structured.values &&
      typeof structured.values ===
        "object"
    ) {
      const value =
        this.evaluateExpressionWithVariables(
          structured.expression,
          structured.values
        );

      if (
        value !== null
      ) {
        return this.result(
          "substitution",
          "single-value",
          value,
          {
            expression:
              structured.expression,
            values:
              structured.values,
            value
          },
          `After substitution the answer is ${value}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Simultaneous equations
    // ---------------------------------------------------------

    const simultaneous =
      structured.equations ??
      structured.simultaneousEquations ??
      null;

    if (
      Array.isArray(
        simultaneous
      ) &&
      simultaneous.length >= 2
    ) {
      const solved =
        this.solveSimultaneousEquations(
          simultaneous
        );

      if (
        solved
      ) {
        return this.result(
          "simultaneous-equations",
          "multi-value",
          solved,
          {
            equations:
              simultaneous,
            solution:
              solved
          },
          `The simultaneous equations give ${Object.entries(
            solved
          )
            .map(
              ([key, value]) =>
                `${key} = ${value}`
            )
            .join(", ")}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Structured inequality
    // ---------------------------------------------------------

    if (
      structured.inequality
    ) {
      const inequality =
        this.solveLinearInequality(
          String(
            structured.inequality
          )
        );

      if (
        inequality
      ) {
        return this.result(
          "linear-inequality",
          "expression",
          inequality,
          {
            original:
              structured.inequality,
            solution:
              inequality
          },
          `The solution is ${inequality}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Structured equation
    // ---------------------------------------------------------

    const equation =
      String(
        structured.equation ??
        ""
      )
        .replace(
          /\s+/g,
          ""
        );

    if (
      equation &&
      equation.includes("=")
    ) {
      // Linear equation
      if (
        /x/.test(
          equation
        ) &&
        !/\^2|\*\*2/.test(
          equation
        )
      ) {
        const solution =
          this.solveLinearEquation(
            equation
          );

        if (
          solution !== null
        ) {
          return this.result(
            "linear-equation",
            "single-value",
            solution,
            {
              equation,
              variable:
                "x",
              solution
            },
            `x = ${solution}.`
          );
        }
      }

      // Quadratic equation
      if (
        /x(?:\^2|\*\*2)/.test(
          equation
        )
      ) {
        const roots =
          this.solveQuadraticEquation(
            equation
          );

        if (
          roots
        ) {
          return this.result(
            "quadratic-equation",
            "multi-value",
            roots,
            {
              equation,
              roots
            },
            `The solutions are ${roots.join(
              " and "
            )}.`
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Text-based equation
    // ---------------------------------------------------------

    const equationText =
      normalized.match(
        /(?:solve|work\s*out|find|calculate|what\s+is)\s+(.+?=[^?]+)/i
      );

    if (
      equationText
    ) {
      const cleaned =
        equationText[1]
          .replace(
            /[.,?]+$/g,
            ""
          )
          .replace(
            /\s+/g,
            ""
          );

      if (
        cleaned.includes("=")
      ) {
        if (
          /x/.test(
            cleaned
          ) &&
          !/\^2|\*\*2/.test(
            cleaned
          )
        ) {
          const solution =
            this.solveLinearEquation(
              cleaned
            );

          if (
            solution !== null
          ) {
            return this.result(
              "linear-equation",
              "single-value",
              solution,
              {
                equation:
                  cleaned,
                variable:
                  "x"
              },
              `x = ${solution}.`
            );
          }
        }

        if (
          /x(?:\^2|\*\*2)/.test(
            cleaned
          )
        ) {
          const roots =
            this.solveQuadraticEquation(
              cleaned
            );

          if (
            roots
          ) {
            return this.result(
              "quadratic-equation",
              "multi-value",
              roots,
              {
                equation:
                  cleaned,
                roots
              },
              `The solutions are ${roots.join(
                " and "
              )}.`
            );
          }
        }
      }
    }

    // ---------------------------------------------------------
    // Inequality from text
    // ---------------------------------------------------------

    const inequalityText =
      normalized.match(
        /(?:solve|work\s*out|find)\s+(.+?(?:<=|>=|<|>)[^?]+)/i
      );

    if (
      inequalityText
    ) {
      const cleaned =
        inequalityText[1]
          .replace(
            /[.,?]+$/g,
            ""
          )
          .replace(
            /\s+/g,
            ""
          );

      const solution =
        this.solveLinearInequality(
          cleaned
        );

      if (
        solution
      ) {
        return this.result(
          "linear-inequality",
          "expression",
          solution,
          {
            inequality:
              cleaned,
            solution
          },
          `The solution is ${solution}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Indices / powers
    // ---------------------------------------------------------

    const powerMatch =
      normalized.match(
        /(-?\d+(?:\.\d+)?)\s*(?:\^|\*\*)\s*(-?\d+)/i
      );

    if (
      powerMatch &&
      /index|indices|power|exponent|power\s+of/i.test(
        normalized
      )
    ) {
      const base =
        Number(
          powerMatch[1]
        );

      const exponent =
        Number(
          powerMatch[2]
        );

      const value =
        Math.pow(
          base,
          exponent
        );

      return this.result(
        "indices",
        "single-value",
        value,
        {
          base,
          exponent,
          value
        },
        `${base}^${exponent} = ${value}.`
      );
    }

    // ---------------------------------------------------------
    // Expand brackets
    // ---------------------------------------------------------

    const expandStructured =
      structured.expandExpression ??
      structured.expression ??
      null;

    const expandExpression =
      String(
        expandStructured ??
        normalized
      );

    const expanded =
      this.expandExpression(
        expandExpression
      );

    if (
      expanded &&
      /expand/i.test(
        normalized
      )
    ) {
      return this.result(
        "expanding",
        "expression",
        expanded,
        {
          original:
            expandExpression,
          expanded
        },
        `The expanded expression is ${expanded}.`
      );
    }

    // ---------------------------------------------------------
    // Factorise
    // ---------------------------------------------------------

    const factorExpression =
      structured.factorExpression ??
      structured.expression ??
      null;

    const factorised =
      this.factoriseExpression(
        String(
          factorExpression ??
          normalized
        )
      );

    if (
      factorised &&
      /factor(?:ise|ize)/i.test(
        normalized
      )
    ) {
      return this.result(
        "factorising",
        "expression",
        factorised,
        {
          original:
            factorExpression ??
            normalized,
          factorised
        },
        `The factorised expression is ${factorised}.`
      );
    }

    // ---------------------------------------------------------
    // Simplifying
    // ---------------------------------------------------------

    const simplification =
      this.simplifyAlgebraicExpression(
        structured.expression ??
        normalized
      );

    if (
      simplification &&
      /simplify|simplifying|simplified/i.test(
        normalized
      )
    ) {
      return this.result(
        "simplifying",
        "expression",
        simplification,
        {
          original:
            structured.expression ??
            normalized,
          simplified:
            simplification
        },
        `The simplified expression is ${simplification}.`
      );
    }

    return null;
  }

  // ===========================================================
  // VARIABLE SUBSTITUTION
  // ===========================================================

  evaluateExpressionWithVariables(
    expression,
    values
  ) {
    if (
      !expression ||
      !values ||
      typeof values !==
        "object"
    ) {
      return null;
    }

    let result =
      String(
        expression
      )
        .replace(
          /²/g,
          "^2"
        )
        .replace(
          /³/g,
          "^3"
        );

    for (
      const [
        variable,
        value
      ] of Object.entries(
        values
      )
    ) {
      const numericValue =
        Number(
          value
        );

      if (
        !Number.isFinite(
          numericValue
        )
      ) {
        return null;
      }

      result =
        result.replace(
          new RegExp(
            `\\b${this.escapeRegex(
              variable
            )}\\b`,
            "g"
          ),
          `(${numericValue})`
        );
    }

    // Basic implicit multiplication.
    result =
      result
        .replace(
          /(\d|\))\s*([a-zA-Z])/g,
          "$1*$2"
        )
        .replace(
          /(\))\s*\(/g,
          "$1*("
        );

    // Remaining letters mean an unresolved variable.
    if (
      /[a-zA-Z]/.test(
        result
      )
    ) {
      return null;
    }

    result =
      result.replace(
        /\^/g,
        "**"
      );

    return this.safeArithmetic(
      result
    );
  }

  // ===========================================================
  // LINEAR EQUATION
  // ===========================================================

  solveLinearEquation(
    equation
  ) {
    const cleaned =
      String(
        equation
      )
        .replace(
          /[−–—]/g,
          "-"
        )
        .replace(
          /\s+/g,
          ""
        );

    const parts =
      cleaned.split("=");

    if (
      parts.length !== 2
    ) {
      return null;
    }

    const left =
      this.linearCoefficients(
        parts[0]
      );

    const right =
      this.linearCoefficients(
        parts[1]
      );

    if (
      !left ||
      !right
    ) {
      return null;
    }

    const coefficient =
      left.a -
      right.a;

    const constant =
      right.b -
      left.b;

    // Identity / contradiction.
    if (
      coefficient === 0
    ) {
      return null;
    }

    return (
      constant /
      coefficient
    );
  }

  // ===========================================================
  // LINEAR COEFFICIENT PARSER
  // ===========================================================

  linearCoefficients(
    expression
  ) {
    let cleaned =
      String(
        expression
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /\*/g,
          ""
        );

    if (
      !cleaned
    ) {
      return null;
    }

    // Turn subtraction into addition of negatives.
    cleaned =
      cleaned.replace(
        /-/g,
        "+-"
      );

    const terms =
      cleaned
        .split("+")
        .filter(
          Boolean
        );

    let a = 0;
    let b = 0;

    for (
      let term of
        terms
    ) {
      term =
        term.trim();

      if (
        !term
      ) {
        continue;
      }

      if (
        term.includes(
          "x"
        )
      ) {
        const coefficient =
          term.replace(
            /x/gi,
            ""
          );

        if (
          coefficient === "" ||
          coefficient === "+"
        ) {
          a += 1;
        } else if (
          coefficient === "-"
        ) {
          a -= 1;
        } else {
          const value =
            Number(
              coefficient
            );

          if (
            !Number.isFinite(
              value
            )
          ) {
            return null;
          }

          a += value;
        }
      } else {
        const value =
          Number(
            term
          );

        if (
          !Number.isFinite(
            value
          )
        ) {
          return null;
        }

        b += value;
      }
    }

    return {
      a,
      b
    };
  }

  // ===========================================================
  // LINEAR INEQUALITY
  // ===========================================================

  solveLinearInequality(
    inequality
  ) {
    const cleaned =
      String(
        inequality
      )
        .replace(
          /≤/g,
          "<="
        )
        .replace(
          /≥/g,
          ">="
        )
        .replace(
          /−/g,
          "-"
        )
        .replace(
          /\s+/g,
          ""
        );

    const match =
      cleaned.match(
        /^(.*?)((?:<=|>=|<|>))(.*)$/
      );

    if (
      !match
    ) {
      return null;
    }

    const left =
      this.linearCoefficients(
        match[1]
      );

    const right =
      this.linearCoefficients(
        match[3]
      );

    if (
      !left ||
      !right
    ) {
      return null;
    }

    let coefficient =
      left.a -
      right.a;

    let constant =
      right.b -
      left.b;

    let symbol =
      match[2];

    if (
      coefficient === 0
    ) {
      return null;
    }

    let solution =
      constant /
      coefficient;

    // Dividing an inequality by a negative number
    // reverses the inequality.
    if (
      coefficient < 0
    ) {
      if (
        symbol === "<"
      ) {
        symbol =
          ">";
      } else if (
        symbol === ">"
      ) {
        symbol =
          "<";
      } else if (
        symbol === "<="
      ) {
        symbol =
          ">=";
      } else if (
        symbol === ">="
      ) {
        symbol =
          "<=";
      }
    }

    return `x ${symbol} ${this.roundNumber(
      solution
    )}`;
  }

  // ===========================================================
  // QUADRATIC EQUATION
  // ===========================================================

  solveQuadraticEquation(
    equation
  ) {
    const cleaned =
      String(
        equation
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /−/g,
          "-"
        );

    const parts =
      cleaned.split("=");

    if (
      parts.length !== 2
    ) {
      return null;
    }

    const left =
      this.quadraticCoefficients(
        parts[0]
      );

    const right =
      this.quadraticCoefficients(
        parts[1]
      );

    if (
      !left ||
      !right
    ) {
      return null;
    }

    const a =
      left.a -
      right.a;

    const b =
      left.b -
      right.b;

    const c =
      left.c -
      right.c;

    if (
      a === 0
    ) {
      if (
        b === 0
      ) {
        return null;
      }

      return [
        -c / b
      ];
    }

    const discriminant =
      b * b -
      4 * a * c;

    if (
      discriminant < 0
    ) {
      return null;
    }

    if (
      discriminant === 0
    ) {
      return [
        this.roundNumber(
          -b /
          (2 * a)
        )
      ];
    }

    const sqrt =
      Math.sqrt(
        discriminant
      );

    const x1 =
      (
        -b +
        sqrt
      ) /
      (2 * a);

    const x2 =
      (
        -b -
        sqrt
      ) /
      (2 * a);

    return [
      this.roundNumber(
        x1
      ),
      this.roundNumber(
        x2
      )
    ].sort(
      (
        x,
        y
      ) =>
        x - y
    );
  }

  // ===========================================================
  // QUADRATIC COEFFICIENT PARSER
  // ===========================================================

  quadraticCoefficients(
    expression
  ) {
    let cleaned =
      String(
        expression
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /²/g,
          "^2"
        )
        .replace(
          /\*/g,
          ""
        );

    cleaned =
      cleaned.replace(
        /-/g,
        "+-"
      );

    const terms =
      cleaned
        .split("+")
        .filter(
          Boolean
        );

    let a = 0;
    let b = 0;
    let c = 0;

    for (
      let term of
        terms
    ) {
      if (
        term.includes(
          "x^2"
        )
      ) {
        const coefficient =
          term.replace(
            /x\^2/gi,
            ""
          );

        if (
          coefficient === "" ||
          coefficient === "+"
        ) {
          a += 1;
        } else if (
          coefficient === "-"
        ) {
          a -= 1;
        } else {
          const value =
            Number(
              coefficient
            );

          if (
            !Number.isFinite(
              value
            )
          ) {
            return null;
          }

          a += value;
        }

        continue;
      }

      if (
        term.includes(
          "x"
        )
      ) {
        const coefficient =
          term.replace(
            /x/gi,
            ""
          );

        if (
          coefficient === "" ||
          coefficient === "+"
        ) {
          b += 1;
        } else if (
          coefficient === "-"
        ) {
          b -= 1;
        } else {
          const value =
            Number(
              coefficient
            );

          if (
            !Number.isFinite(
              value
            )
          ) {
            return null;
          }

          b += value;
        }

        continue;
      }

      const value =
        Number(
          term
        );

      if (
        !Number.isFinite(
          value
        )
      ) {
        return null;
      }

      c += value;
    }

    return {
      a,
      b,
      c
    };
  }

  // ===========================================================
  // SIMULTANEOUS EQUATIONS
  // ===========================================================

  solveSimultaneousEquations(
    equations
  ) {
    if (
      !Array.isArray(
        equations
      ) ||
      equations.length < 2
    ) {
      return null;
    }

    const first =
      this.parseTwoVariableLinearEquation(
        equations[0]
      );

    const second =
      this.parseTwoVariableLinearEquation(
        equations[1]
      );

    if (
      !first ||
      !second
    ) {
      return null;
    }

    const determinant =
      first.a *
      second.b -
      second.a *
      first.b;

    if (
      determinant === 0
    ) {
      return null;
    }

    const x =
      (
        first.c *
        second.b -
        second.c *
        first.b
      ) /
      determinant;

    const y =
      (
        first.a *
        second.c -
        second.a *
        first.c
      ) /
      determinant;

    return {
      x:
        this.roundNumber(
          x
        ),
      y:
        this.roundNumber(
          y
        )
    };
  }

  parseTwoVariableLinearEquation(
    equation
  ) {
    const parts =
      String(
        equation
      )
        .replace(
          /\s+/g,
          ""
        )
        .split("=");

    if (
      parts.length !== 2
    ) {
      return null;
    }

    const left =
      this.twoVariableCoefficients(
        parts[0]
      );

    const right =
      this.twoVariableCoefficients(
        parts[1]
      );

    if (
      !left ||
      !right
    ) {
      return null;
    }

    return {
      a:
        left.x -
        right.x,

      b:
        left.y -
        right.y,

      c:
        right.constant -
        left.constant
    };
  }

  twoVariableCoefficients(
    expression
  ) {
    let cleaned =
      String(
        expression
      )
        .replace(
          /\s+/g,
          ""
        );

    cleaned =
      cleaned.replace(
        /-/g,
        "+-"
      );

    const terms =
      cleaned
        .split("+")
        .filter(
          Boolean
        );

    let x = 0;
    let y = 0;
    let constant = 0;

    for (
      let term of
        terms
    ) {
      if (
        term.includes(
          "x"
        )
      ) {
        const coefficient =
          term.replace(
            /x/gi,
            ""
          );

        if (
          coefficient === "" ||
          coefficient === "+"
        ) {
          x += 1;
        } else if (
          coefficient === "-"
        ) {
          x -= 1;
        } else {
          const value =
            Number(
              coefficient
            );

          if (
            !Number.isFinite(
              value
            )
          ) {
            return null;
          }

          x += value;
        }

        continue;
      }

      if (
        term.includes(
          "y"
        )
      ) {
        const coefficient =
          term.replace(
            /y/gi,
            ""
          );

        if (
          coefficient === "" ||
          coefficient === "+"
        ) {
          y += 1;
        } else if (
          coefficient === "-"
        ) {
          y -= 1;
        } else {
          const value =
            Number(
              coefficient
            );

          if (
            !Number.isFinite(
              value
            )
          ) {
            return null;
          }

          y += value;
        }

        continue;
      }

      const value =
        Number(
          term
        );

      if (
        !Number.isFinite(
          value
        )
      ) {
        return null;
      }

      constant +=
        value;
    }

    return {
      x,
      y,
      constant
    };
  }

  // ===========================================================
  // EXPANSION
  // ===========================================================

  expandExpression(
    expression
  ) {
    const text =
      String(
        expression ?? ""
      )
        .replace(
          /\s+/g,
          ""
        );

    // (x+a)(x+b)
    let match =
      text.match(
        /\(\s*x([+-]\d+(?:\.\d+)?)\s*\)\(\s*x([+-]\d+(?:\.\d+)?)\s*\)/i
      );

    if (
      match
    ) {
      const a =
        Number(
          match[1]
        );

      const b =
        Number(
          match[2]
        );

      const linear =
        a + b;

      const constant =
        a * b;

      return this.formatQuadratic(
        1,
        linear,
        constant
      );
    }

    // (x+a)^2
    match =
      text.match(
        /\(\s*x([+-]\d+(?:\.\d+)?)\s*\)\^2/i
      );

    if (
      match
    ) {
      const a =
        Number(
          match[1]
        );

      return this.formatQuadratic(
        1,
        2 * a,
        a * a
      );
    }

    return null;
  }

  // ===========================================================
  // FACTORISING
  // ===========================================================

  factoriseExpression(
    expression
  ) {
    const text =
      String(
        expression ?? ""
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /²/g,
          "^2"
        );

    const match =
      text.match(
        /x\^2([+-]\d+)x([+-]\d+)/i
      );

    if (
      !match
    ) {
      return null;
    }

    const b =
      Number(
        match[1]
      );

    const c =
      Number(
        match[2]
      );

    for (
      let a = -100;
      a <= 100;
      a++
    ) {
      if (
        a === 0
      ) {
        continue;
      }

      if (
        c % a !== 0
      ) {
        continue;
      }

      const d =
        c / a;

      if (
        a + d === b
      ) {
        return (
          `(x ${a >= 0 ? "+" : "-"} ${Math.abs(
            a
          )})(x ${
            d >= 0
              ? "+"
              : "-"
          } ${Math.abs(
            d
          )})`
        );
      }
    }

    return null;
  }

  // ===========================================================
  // SIMPLIFY BASIC ALGEBRA
  // ===========================================================

  simplifyAlgebraicExpression(
    expression
  ) {
    const text =
      String(
        expression ?? ""
      )
        .trim();

    // Simple numerical expressions.
    const arithmetic =
      this.cleanArithmeticExpression(
        text
      );

    if (
      arithmetic &&
      !/[a-z]/i.test(
        arithmetic
      )
    ) {
      const value =
        this.safeArithmetic(
          arithmetic
        );

      if (
        value !== null
      ) {
        return String(
          value
        );
      }
    }

    // x + x -> 2x
    let match =
      text.match(
        /^\s*x\s*\+\s*x\s*$/i
      );

    if (
      match
    ) {
      return "2x";
    }

    // ax + bx
    match =
      text.match(
        /^\s*(-?\d+(?:\.\d+)?)x\s*([+-])\s*(\d+(?:\.\d+)?)x\s*$/i
      );

    if (
      match
    ) {
      const a =
        Number(
          match[1]
        );

      const b =
        Number(
          `${match[2] === "-" ? "-" : ""}${match[3]}`
        );

      return this.formatLinear(
        a + b
      );
    }

    return null;
  }

  formatLinear(
    coefficient
  ) {
    if (
      coefficient === 0
    ) {
      return "0";
    }

    if (
      coefficient === 1
    ) {
      return "x";
    }

    if (
      coefficient === -1
    ) {
      return "-x";
    }

    return `${coefficient}x`;
  }

  formatQuadratic(
    a,
    b,
    c
  ) {
    let result =
      "";

    if (
      a !== 0
    ) {
      if (
        a === 1
      ) {
        result +=
          "x^2";
      } else if (
        a === -1
      ) {
        result +=
          "-x^2";
      } else {
        result +=
          `${a}x^2`;
      }
    }

    if (
      b !== 0
    ) {
      const sign =
        b > 0
          ? "+"
          : "-";

      const magnitude =
        Math.abs(
          b
        );

      if (
        magnitude === 1
      ) {
        result +=
          ` ${sign} x`;
      } else {
        result +=
          ` ${sign} ${magnitude}x`;
      }
    }

    if (
      c !== 0
    ) {
      const sign =
        c > 0
          ? "+"
          : "-";

      result +=
        ` ${sign} ${Math.abs(
          c
        )}`;
    }

    return (
      result.trim() ||
      "0"
    );
  }

    // ===========================================================
  // TRIGONOMETRY
  // ===========================================================

  solveTrigonometry(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Direct structured answer
    // ---------------------------------------------------------

    if (
      structured.calculatedValue !==
        undefined &&
      /sin|cos|tan|trigonometry|angle|opposite|adjacent|hypotenuse/i.test(
        normalized
      )
    ) {
      const value =
        Number(
          structured.calculatedValue
        );

      if (
        Number.isFinite(
          value
        )
      ) {
        return this.result(
          "trigonometry",
          "single-value",
          value,
          structured,
          `The calculated trigonometric value is ${value}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Structured triangle data
    // ---------------------------------------------------------

    const opposite =
      this.firstFinite(
        structured.opposite,
        structured.oppositeLength
      );

    const adjacent =
      this.firstFinite(
        structured.adjacent,
        structured.adjacentLength
      );

    const hypotenuse =
      this.firstFinite(
        structured.hypotenuse,
        structured.hypotenuseLength
      );

    const angle =
      this.firstFinite(
        structured.angle,
        structured.angleDegrees
      );

    // ---------------------------------------------------------
    // Find missing side from angle
    // ---------------------------------------------------------

    if (
      angle !== null &&
      Number.isFinite(angle)
    ) {
      const radians =
        angle *
        Math.PI /
        180;

      // sin(angle) = opposite / hypotenuse
      if (
        opposite === null &&
        hypotenuse !== null
      ) {
        const value =
          hypotenuse *
          Math.sin(
            radians
          );

        return this.result(
          "trigonometry-sine-side",
          "single-value",
          this.roundNumber(
            value
          ),
          {
            angle,
            hypotenuse,
            formula:
              "opposite = hypotenuse × sin(angle)"
          },
          `The opposite side is approximately ${this.roundNumber(
            value
          )}.`
        );
      }

      // cos(angle) = adjacent / hypotenuse
      if (
        adjacent === null &&
        hypotenuse !== null
      ) {
        const value =
          hypotenuse *
          Math.cos(
            radians
          );

        return this.result(
          "trigonometry-cosine-side",
          "single-value",
          this.roundNumber(
            value
          ),
          {
            angle,
            hypotenuse,
            formula:
              "adjacent = hypotenuse × cos(angle)"
          },
          `The adjacent side is approximately ${this.roundNumber(
            value
          )}.`
        );
      }

      // tan(angle) = opposite / adjacent
      if (
        opposite === null &&
        adjacent !== null
      ) {
        const value =
          adjacent *
          Math.tan(
            radians
          );

        return this.result(
          "trigonometry-tangent-side",
          "single-value",
          this.roundNumber(
            value
          ),
          {
            angle,
            adjacent,
            formula:
              "opposite = adjacent × tan(angle)"
          },
          `The opposite side is approximately ${this.roundNumber(
            value
          )}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Find missing angle
    // ---------------------------------------------------------

    if (
      angle === null
    ) {
      if (
        opposite !== null &&
        hypotenuse !== null &&
        hypotenuse !== 0
      ) {
        const ratio =
          opposite /
          hypotenuse;

        if (
          ratio >= -1 &&
          ratio <= 1 &&
          /angle|sin/i.test(
            normalized
          )
        ) {
          const value =
            Math.asin(
              ratio
            ) *
            180 /
            Math.PI;

          return this.result(
            "trigonometry-inverse-sine",
            "single-value",
            this.roundNumber(
              value
            ),
            {
              opposite,
              hypotenuse,
              ratio
            },
            `The angle is approximately ${this.roundNumber(
              value
            )}°.`
          );
        }
      }

      if (
        adjacent !== null &&
        hypotenuse !== null &&
        hypotenuse !== 0 &&
        /angle|cos/i.test(
          normalized
        )
      ) {
        const ratio =
          adjacent /
          hypotenuse;

        if (
          ratio >= -1 &&
          ratio <= 1
        ) {
          const value =
            Math.acos(
              ratio
            ) *
            180 /
            Math.PI;

          return this.result(
            "trigonometry-inverse-cosine",
            "single-value",
            this.roundNumber(
              value
            ),
            {
              adjacent,
              hypotenuse,
              ratio
            },
            `The angle is approximately ${this.roundNumber(
              value
            )}°.`
          );
        }
      }

      if (
        opposite !== null &&
        adjacent !== null &&
        /angle|tan/i.test(
          normalized
        )
      ) {
        const value =
          Math.atan2(
            opposite,
            adjacent
          ) *
          180 /
          Math.PI;

        return this.result(
          "trigonometry-inverse-tangent",
          "single-value",
          this.roundNumber(
            value
          ),
          {
            opposite,
            adjacent
          },
          `The angle is approximately ${this.roundNumber(
            value
          )}°.`
        );
      }
    }

    // ---------------------------------------------------------
    // Direct sin/cos/tan
    // ---------------------------------------------------------

    const direct =
      normalized.match(
        /\b(sin|cos|tan)\s*\(\s*(-?\d+(?:\.\d+)?)\s*(?:°|degrees?)?\s*\)/i
      );

    if (
      direct
    ) {
      const fn =
        direct[1].toLowerCase();

      const degrees =
        Number(
          direct[2]
        );

      const radians =
        degrees *
        Math.PI /
        180;

      let value;

      if (
        fn === "sin"
      ) {
        value =
          Math.sin(
            radians
          );
      } else if (
        fn === "cos"
      ) {
        value =
          Math.cos(
            radians
          );
      } else {
        value =
          Math.tan(
            radians
          );
      }

      return this.result(
        "trigonometry-direct",
        "single-value",
        this.roundNumber(
          value
        ),
        {
          function:
            fn,
          angle:
            degrees,
          radians
        },
        `${fn}(${degrees}°) = ${this.roundNumber(
          value
        )}.`
      );
    }

    return null;
  }

  // ===========================================================
  // COORDINATES / DISTANCE / MIDPOINT / GRADIENT / INTERCEPT
  // ===========================================================

  solveCoordinates(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    const points =
      this.extractPoints(
        structured
      );

    // ---------------------------------------------------------
    // Coordinate lookup
    // ---------------------------------------------------------

    const target =
      structured.targetCoordinates ??
      null;

    if (
      target &&
      Number.isFinite(
        Number(target.x)
      ) &&
      Number.isFinite(
        Number(target.y)
      ) &&
      points.length > 0
    ) {
      const match =
        points.find(
          point =>
            this.nearlyEqual(
              point.x,
              Number(target.x)
            ) &&
            this.nearlyEqual(
              point.y,
              Number(target.y)
            )
        );

      if (
        match
      ) {
        return this.result(
          "coordinate-lookup",
          "coordinate",
          match.label ??
            [
              match.x,
              match.y
            ],
          {
            target,
            matchedPoint:
              match,
            points
          },
          `The point at (${target.x}, ${target.y}) is ${
            match.label ??
            `(${match.x}, ${match.y})`
          }.`
        );
      }
    }

    // ---------------------------------------------------------
    // Midpoint
    // ---------------------------------------------------------

    if (
      points.length >= 2 &&
      /midpoint/i.test(
        normalized
      )
    ) {
      const a =
        points[0];

      const b =
        points[1];

      const midpoint = {
        x:
          (
            a.x +
            b.x
          ) / 2,

        y:
          (
            a.y +
            b.y
          ) / 2
      };

      return this.result(
        "midpoint",
        "coordinate",
        midpoint,
        {
          pointA:
            a,
          pointB:
            b,
          midpoint
        },
        `The midpoint is (${midpoint.x}, ${midpoint.y}).`
      );
    }

    // ---------------------------------------------------------
    // Distance
    // ---------------------------------------------------------

    if (
      points.length >= 2 &&
      /distance|length of segment/i.test(
        normalized
      )
    ) {
      const a =
        points[0];

      const b =
        points[1];

      const distance =
        Math.hypot(
          b.x -
            a.x,
          b.y -
            a.y
        );

      return this.result(
        "coordinate-distance",
        "single-value",
        this.roundNumber(
          distance
        ),
        {
          pointA:
            a,
          pointB:
            b,
          distance
        },
        `The distance is ${this.roundNumber(
          distance
        )}.`
      );
    }

    // ---------------------------------------------------------
    // Gradient from points
    // ---------------------------------------------------------

    if (
      points.length >= 2 &&
      /gradient|slope/i.test(
        normalized
      )
    ) {
      const a =
        points[0];

      const b =
        points[1];

      const dx =
        b.x -
        a.x;

      if (
        dx !== 0
      ) {
        const gradient =
          (
            b.y -
            a.y
          ) /
          dx;

        return this.result(
          "gradient-from-points",
          "single-value",
          this.roundNumber(
            gradient
          ),
          {
            pointA:
              a,
            pointB:
              b,
            gradient
          },
          `The gradient is ${this.roundNumber(
            gradient
          )}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Equation
    // ---------------------------------------------------------

    const equation =
      String(
        structured.equation ??
        ""
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /[−–—]/g,
          "-"
        );

    if (
      equation
    ) {
      if (
        /gradient|slope/i.test(
          normalized
        )
      ) {
        const gradient =
          this.extractGradient(
            equation
          );

        if (
          gradient !== null
        ) {
          return this.result(
            "gradient-from-equation",
            "single-value",
            gradient,
            {
              equation,
              gradient
            },
            `The gradient is ${gradient}.`
          );
        }
      }

      if (
        /intercept/i.test(
          normalized
        )
      ) {
        const intercept =
          this.extractIntercept(
            equation
          );

        if (
          intercept !== null
        ) {
          return this.result(
            "y-intercept",
            "single-value",
            intercept,
            {
              equation,
              intercept
            },
            `The y-intercept is ${intercept}.`
          );
        }
      }
    }

    return null;
  }

  extractPoints(
    structured
  ) {
    const result = [];

    const sources = [
      structured?.dataPoints,
      structured?.points,
      structured?.coordinates,
      structured?.diagram?.elements,
      structured?.series
    ];

    for (
      const source of
        sources
    ) {
      if (
        !Array.isArray(
          source
        )
      ) {
        continue;
      }

      for (
        const item of
          source
      ) {
        if (
          Array.isArray(
            item
          ) &&
          item.length >= 2
        ) {
          const x =
            Number(
              item[0]
            );

          const y =
            Number(
              item[1]
            );

          if (
            Number.isFinite(
              x
            ) &&
            Number.isFinite(
              y
            )
          ) {
            result.push({
              x,
              y,
              label:
                null
            });
          }

          continue;
        }

        if (
          !item ||
          typeof item !==
            "object"
        ) {
          continue;
        }

        if (
          Array.isArray(
            item.coordinates
          ) &&
          item.coordinates.length >= 2
        ) {
          const x =
            Number(
              item.coordinates[0]
            );

          const y =
            Number(
              item.coordinates[1]
            );

          if (
            Number.isFinite(
              x
            ) &&
            Number.isFinite(
              y
            )
          ) {
            result.push({
              x,
              y,
              label:
                item.label ??
                null
            });
          }

          continue;
        }

        const x =
          Number(
            item.x ??
            item.journeys ??
            item.coordinateX
          );

        const y =
          Number(
            item.y ??
            item.distance_miles ??
            item.distance ??
            item.value ??
            item.coordinateY
          );

        if (
          Number.isFinite(
            x
          ) &&
          Number.isFinite(
            y
          )
        ) {
          result.push({
            x,
            y,
            label:
              item.label ??
              null
          });
        }
      }
    }

    // Remove exact duplicates.
    return result.filter(
      (
        point,
        index,
        array
      ) =>
        array.findIndex(
          candidate =>
            this.nearlyEqual(
              candidate.x,
              point.x
            ) &&
            this.nearlyEqual(
              candidate.y,
              point.y
            ) &&
            candidate.label ===
              point.label
        ) === index
    );
  }

  extractGradient(
    equation
  ) {
    const cleaned =
      String(
        equation
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /[−–—]/g,
          "-"
        );

    // y = mx + c
    let match =
      cleaned.match(
        /^y=([+-]?\d*\.?\d*)x(?:[+-]\d+(?:\.\d+)?)?$/
      );

    if (
      match
    ) {
      const coefficient =
        match[1];

      if (
        coefficient === "" ||
        coefficient === "+"
      ) {
        return 1;
      }

      if (
        coefficient === "-"
      ) {
        return -1;
      }

      const value =
        Number(
          coefficient
        );

      return Number.isFinite(
        value
      )
        ? value
        : null;
    }

    // mx + c = y
    match =
      cleaned.match(
        /^([+-]?\d*\.?\d*)x(?:[+-]\d+(?:\.\d+)?)?=y$/
      );

    if (
      match
    ) {
      const coefficient =
        match[1];

      if (
        coefficient === "" ||
        coefficient === "+"
      ) {
        return 1;
      }

      if (
        coefficient === "-"
      ) {
        return -1;
      }

      const value =
        Number(
          coefficient
        );

      return Number.isFinite(
        value
      )
        ? value
        : null;
    }

    return null;
  }

  extractIntercept(
    equation
  ) {
    const cleaned =
      String(
        equation
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /[−–—]/g,
          "-"
        );

    const match =
      cleaned.match(
        /^y=[+-]?\d*\.?\d*x([+-]\d+(?:\.\d+)?)$/
      );

    if (
      match
    ) {
      return Number(
        match[1]
      );
    }

    // y = mx has intercept 0.
    const gradient =
      this.extractGradient(
        cleaned
      );

    if (
      gradient !== null &&
      /^y=/.test(
        cleaned
      )
    ) {
      return 0;
    }

    return null;
  }

  // ===========================================================
  // TRANSFORMATIONS
  // ===========================================================

  solveTransformations(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    const point =
      structured.point ??
      structured.originalPoint ??
      null;

    // ---------------------------------------------------------
    // Reflection
    // ---------------------------------------------------------

    if (
      point &&
      /reflection|reflect/i.test(
        normalized
      )
    ) {
      const x =
        Number(
          point.x
        );

      const y =
        Number(
          point.y
        );

      if (
        Number.isFinite(x) &&
        Number.isFinite(y)
      ) {
        let reflected;

        if (
          /x-axis/i.test(
            normalized
          )
        ) {
          reflected = {
            x,
            y: -y
          };
        } else if (
          /y-axis/i.test(
            normalized
          )
        ) {
          reflected = {
            x: -x,
            y
          };
        } else if (
          /y\s*=\s*x/i.test(
            normalized
          )
        ) {
          reflected = {
            x: y,
            y: x
          };
        } else if (
          /y\s*=\s*-x/i.test(
            normalized
          )
        ) {
          reflected = {
            x: -y,
            y: -x
          };
        } else {
          return null;
        }

        return this.result(
          "reflection",
          "coordinate",
          reflected,
          {
            original:
              point,
            reflected
          },
          `The reflected point is (${reflected.x}, ${reflected.y}).`
        );
      }
    }

    // ---------------------------------------------------------
    // Rotation
    // ---------------------------------------------------------

    if (
      point &&
      /rotation|rotate/i.test(
        normalized
      )
    ) {
      const x =
        Number(
          point.x
        );

      const y =
        Number(
          point.y
        );

      const angle =
        this.firstFinite(
          structured.angle,
          structured.angleDegrees
        );

      const centerX =
        this.firstFinite(
          structured.centerX
        ) ?? 0;

      const centerY =
        this.firstFinite(
          structured.centerY
        ) ?? 0;

      if (
        Number.isFinite(
          x
        ) &&
        Number.isFinite(
          y
        ) &&
        angle !== null
      ) {
        const radians =
          angle *
          Math.PI /
          180;

        const dx =
          x -
          centerX;

        const dy =
          y -
          centerY;

        const rotated = {
          x:
            this.roundNumber(
              centerX +
              dx *
                Math.cos(
                  radians
                ) -
              dy *
                Math.sin(
                  radians
                )
            ),

          y:
            this.roundNumber(
              centerY +
              dx *
                Math.sin(
                  radians
                ) +
              dy *
                Math.cos(
                  radians
                )
            )
        };

        return this.result(
          "rotation",
          "coordinate",
          rotated,
          {
            point,
            angle,
            center: {
              x:
                centerX,
              y:
                centerY
            },
            rotated
          },
          `The rotated point is (${rotated.x}, ${rotated.y}).`
        );
      }
    }

    // ---------------------------------------------------------
    // Symmetry order
    // ---------------------------------------------------------

    const symmetryOrder =
      this.firstFinite(
        structured.orderOfSymmetry,
        structured.symmetryOrder
      );

    if (
      symmetryOrder !== null &&
      /symmetry/i.test(
        normalized
      )
    ) {
      return this.result(
        "symmetry-order",
        "single-value",
        symmetryOrder,
        {
          symmetryOrder
        },
        `The order of symmetry is ${symmetryOrder}.`
      );
    }

    // ---------------------------------------------------------
    // Symmetry type
    // ---------------------------------------------------------

    if (
      /line of symmetry|symmetry/i.test(
        normalized
      )
    ) {
      const symmetryLine =
        structured.lineOfSymmetry ??
        structured.symmetryLine ??
        null;

      if (
        symmetryLine
      ) {
        return this.result(
          "line-of-symmetry",
          "expression",
          symmetryLine,
          {
            symmetryLine
          },
          `The line of symmetry is ${symmetryLine}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Vectors
    // ---------------------------------------------------------

    if (
      /vector/i.test(
        normalized
      )
    ) {
      const vector =
        structured.vector ??
        null;

      if (
        Array.isArray(
          vector
        ) &&
        vector.length >= 2
      ) {
        return this.result(
          "vector",
          "vector",
          vector,
          {
            vector
          },
          `The vector is (${vector.join(
            ", "
          )}).`
        );
      }

      if (
        structured.vectorA &&
        structured.vectorB
      ) {
        const a =
          structured.vectorA;

        const b =
          structured.vectorB;

        const ax =
          Number(
            a[0] ??
            a.x
          );

        const ay =
          Number(
            a[1] ??
            a.y
          );

        const bx =
          Number(
            b[0] ??
            b.x
          );

        const by =
          Number(
            b[1] ??
            b.y
          );

        if (
          [
            ax,
            ay,
            bx,
            by
          ].every(
            Number.isFinite
          )
        ) {
          const resultVector = [
            bx - ax,
            by - ay
          ];

          return this.result(
            "vector-difference",
            "vector",
            resultVector,
            {
              from:
                [
                  ax,
                  ay
                ],
              to:
                [
                  bx,
                  by
                ],
              vector:
                resultVector
            },
            `The vector is (${resultVector.join(
              ", "
            )}).`
          );
        }
      }
    }

    return null;
  }

  // ===========================================================
  // ANGLES / BEARINGS / SCALE
  // ===========================================================

  solveAngles(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Direct angle
    // ---------------------------------------------------------

    const directAngle =
      this.firstFinite(
        structured.calculatedAngle,
        structured.angle,
        structured.answer
      );

    if (
      directAngle !== null &&
      /angle/i.test(
        normalized
      )
    ) {
      return this.result(
        "angle",
        "single-value",
        directAngle,
        structured,
        `The angle is ${directAngle}°.`
      );
    }

    // ---------------------------------------------------------
    // Angles on a straight line
    // ---------------------------------------------------------

    const lineAngles =
      this.extractNumericArray(
        structured.angles
      );

    if (
      lineAngles.length > 0 &&
      /straight line|straight angle/i.test(
        normalized
      )
    ) {
      const known =
        lineAngles.reduce(
          (
            sum,
            value
          ) =>
            sum +
            value,
          0
        );

      const missing =
        180 -
        known;

      if (
        missing >= 0 &&
        missing <= 180
      ) {
        return this.result(
          "angle-on-line",
          "single-value",
          missing,
          {
            knownAngles:
              lineAngles,
            total:
              180,
            missing
          },
          `The missing angle is ${missing}°.`
        );
      }
    }

    // ---------------------------------------------------------
    // Angles around a point
    // ---------------------------------------------------------

    if (
      lineAngles.length > 0 &&
      /around a point|full turn/i.test(
        normalized
      )
    ) {
      const known =
        lineAngles.reduce(
          (
            sum,
            value
          ) =>
            sum +
            value,
          0
        );

      const missing =
        360 -
        known;

      if (
        missing >= 0 &&
        missing <= 360
      ) {
        return this.result(
          "angles-around-point",
          "single-value",
          missing,
          {
            knownAngles:
              lineAngles,
            total:
              360,
            missing
          },
          `The missing angle is ${missing}°.`
        );
      }
    }

    // ---------------------------------------------------------
    // Triangle angle sum
    // ---------------------------------------------------------

    if (
      lineAngles.length >= 1 &&
      /triangle|angles in a triangle/i.test(
        normalized
      )
    ) {
      const known =
        lineAngles.reduce(
          (
            sum,
            value
          ) =>
            sum +
            value,
          0
        );

      const missing =
        180 -
        known;

      if (
        missing >= 0 &&
        missing <= 180
      ) {
        return this.result(
          "triangle-angle-sum",
          "single-value",
          missing,
          {
            knownAngles:
              lineAngles,
            total:
              180,
            missing
          },
          `The missing triangle angle is ${missing}°.`
        );
      }
    }

    // ---------------------------------------------------------
    // Bearing
    // ---------------------------------------------------------

    const bearing =
      this.firstFinite(
        structured.bearing,
        structured.angleFromNorth
      );

    if (
      bearing !== null &&
      /bearing/i.test(
        normalized
      )
    ) {
      const normalised =
        (
          bearing %
          360 +
          360
        ) %
        360;

      return this.result(
        "bearing",
        "single-value",
        normalised,
        {
          bearing:
            normalised
        },
        `The bearing is ${String(
          normalised
        ).padStart(
          3,
          "0"
        )}°.`
      );
    }

    // ---------------------------------------------------------
    // Scale
    // ---------------------------------------------------------

    const scale =
      structured.scale;

    if (
      scale &&
      /scale/i.test(
        normalized
      )
    ) {
      const actual =
        this.firstFinite(
          structured.actualDistance,
          structured.realDistance
        );

      const drawing =
        this.firstFinite(
          structured.drawingDistance,
          structured.mapDistance
        );

      if (
        actual !== null &&
        drawing !== null &&
        drawing !== 0
      ) {
        const ratio =
          actual /
          drawing;

        return this.result(
          "scale",
          "single-value",
          ratio,
          {
            actual,
            drawing,
            ratio
          },
          `The scale factor is ${ratio}.`
        );
      }
    }

    return null;
  }

  // ===========================================================
  // NUMBER SKILLS / STANDARD FORM / ROUNDING / BOUNDS
  // ===========================================================

  solveNumberSkills(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Direct standard-form data
    // ---------------------------------------------------------

    if (
      /standard form|scientific notation/i.test(
        normalized
      )
    ) {
      const value =
        this.firstFinite(
          structured.value,
          structured.number,
          structured.decimal
        );

      if (
        value !== null
      ) {
        const standard =
          this.toStandardForm(
            value
          );

        return this.result(
          "standard-form",
          "expression",
          standard,
          {
            value,
            standard
          },
          `${value} in standard form is ${standard}.`
        );
      }

      const coefficient =
        this.firstFinite(
          structured.coefficient
        );

      const exponent =
        this.firstFinite(
          structured.exponent
        );

      if (
        coefficient !== null &&
        exponent !== null
      ) {
        const value =
          coefficient *
          Math.pow(
            10,
            exponent
          );

        return this.result(
          "standard-form-to-number",
          "single-value",
          value,
          {
            coefficient,
            exponent,
            value
          },
          `${coefficient} × 10^${exponent} = ${value}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Rounding
    // ---------------------------------------------------------

    const roundingTargets = [
      ...normalized.matchAll(
        /nearest\s+(10|100|1000|10000|100000|1000000|million|thousand|hundred|whole\s+number|integer)/gi
      )
    ].map(
      match =>
        this.parseRoundingTarget(
          match[1]
        )
    ).filter(
      Number.isFinite
    );

    if (
      roundingTargets.length > 0
    ) {
      const values =
        this.extractNumbersFromText(
          normalized
        );

      if (
        values.length > 0
      ) {
        const source =
          values[
            values.length - 1
          ];

        const rounded =
          {};

        for (
          const target of
            roundingTargets
        ) {
          if (
            target ===
              "whole"
          ) {
            rounded[target] =
              Math.round(
                source
              );
          } else {
            rounded[target] =
              this.roundTo(
                source,
                target
              );
          }
        }

        return this.result(
          "rounding",
          "multi-value",
          rounded,
          {
            source,
            targets:
              roundingTargets,
            rounded
          },
          `Rounded ${source} to the requested place values.`
        );
      }
    }

    // ---------------------------------------------------------
    // Bounds
    // ---------------------------------------------------------

    const bounds =
      structured.bounds ??
      null;

    if (
      bounds &&
      /bounds|upper bound|lower bound/i.test(
        normalized
      )
    ) {
      const lower =
        this.firstFinite(
          bounds.lower,
          bounds.lowerBound
        );

      const upper =
        this.firstFinite(
          bounds.upper,
          bounds.upperBound
        );

      if (
        lower !== null &&
        upper !== null
      ) {
        return this.result(
          "bounds",
          "interval",
          {
            lower,
            upper
          },
          {
            lower,
            upper
          },
          `The bounds are ${lower} to ${upper}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Estimation
    // ---------------------------------------------------------

    if (
      /estimate|estimation|approximately/i.test(
        normalized
      )
    ) {
      const expression =
        this.extractArithmeticExpression(
          normalized
        );

      if (
        expression
      ) {
        const approximate =
          this.safeArithmetic(
            expression
          );

        if (
          approximate !== null
        ) {
          return this.result(
            "estimation",
            "single-value",
            approximate,
            {
              expression,
              approximate
            },
            `The estimated value is approximately ${approximate}.`
          );
        }
      }
    }

    return null;
  }

  parseRoundingTarget(
    value
  ) {
    const text =
      String(
        value ?? ""
      )
        .toLowerCase()
        .trim();

    if (
      text ===
      "whole number"
    ) {
      return "whole";
    }

    if (
      text ===
      "integer"
    ) {
      return "whole";
    }

    if (
      text ===
      "hundred"
    ) {
      return 100;
    }

    if (
      text ===
      "thousand"
    ) {
      return 1000;
    }

    if (
      text ===
      "million"
    ) {
      return 1000000;
    }

    const numeric =
      Number(
        text
      );

    return Number.isFinite(
      numeric
    )
      ? numeric
      : NaN;
  }

  toStandardForm(
    value
  ) {
    if (
      !Number.isFinite(
        Number(value)
      )
    ) {
      return null;
    }

    value =
      Number(
        value
      );

    if (
      value === 0
    ) {
      return "0";
    }

    const exponent =
      Math.floor(
        Math.log10(
          Math.abs(
            value
          )
        )
      );

    const coefficient =
      value /
      Math.pow(
        10,
        exponent
      );

    return `${this.roundNumber(
      coefficient
    )} × 10^${exponent}`;
  }

    // ===========================================================
  // ARITHMETIC / DECIMALS
  // ===========================================================

  solveArithmetic(
    normalized
  ) {
    const expression =
      this.extractArithmeticExpression(
        normalized
      );

    if (!expression) {
      return null;
    }

    const answer =
      this.safeArithmetic(
        expression
      );

    if (
      answer === null
    ) {
      return null;
    }

    return this.result(
      "arithmetic",
      "single-value",
      this.roundNumber(
        answer
      ),
      {
        expression,
        answer
      },
      `${expression} = ${this.roundNumber(answer)}`
    );
  }

  extractArithmeticExpression(
    text
  ) {
    if (!text) {
      return null;
    }

    // ---------------------------------------------------------
    // Explicit arithmetic instruction
    // ---------------------------------------------------------

    const explicit =
      String(text).match(
        /(?:work\s*out|calculate|evaluate|what\s+is|find)\s+(.+?)(?=\s+(?:and\s+then|to\s+the\s+nearest|a\)|b\)|what|write|$)|\?+$)/i
      );

    if (explicit) {
      const cleaned =
        this.cleanArithmeticExpression(
          explicit[1]
        );

      if (cleaned) {
        return cleaned;
      }
    }

    // ---------------------------------------------------------
    // Standalone numeric expression
    // ---------------------------------------------------------

    const match =
      String(text).match(
        /\(?\s*-?\d+(?:\.\d+)?\s*(?:[+\-*/]\s*-?\d+(?:\.\d+)?\s*)+\)?/
      );

    if (!match) {
      return null;
    }

    return this.cleanArithmeticExpression(
      match[0]
    );
  }

  cleanArithmeticExpression(
    expression
  ) {
    if (!expression) {
      return null;
    }

    return String(
      expression
    )
      .replace(
        /×/g,
        "*"
      )
      .replace(
        /÷/g,
        "/"
      )
      .replace(
        /[−–—]/g,
        "-"
      )
      .replace(
        /,/g,
        ""
      )
      .replace(
        /[^0-9+\-*/().\s]/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }

  safeArithmetic(
    expression
  ) {
    if (!expression) {
      return null;
    }

    const cleaned =
      String(
        expression
      ).trim();

    if (
      !/^[0-9+\-*/().\s]+$/.test(
        cleaned
      )
    ) {
      return null;
    }

    // Prevent malformed operator sequences.
    if (
      /[*/+\-]{3,}/.test(
        cleaned.replace(
          /\s/g,
          ""
        )
      )
    ) {
      return null;
    }

    try {
      // eslint-disable-next-line no-new-func
      const fn =
        Function(
          `"use strict"; return (${cleaned})`
        );

      const result =
        fn();

      if (
        typeof result !==
          "number" ||
        !Number.isFinite(
          result
        )
      ) {
        return null;
      }

      return result;
    } catch {
      return null;
    }
  }

  // ===========================================================
  // PERCENTAGES / RATIO / PROPORTION
  // ===========================================================

  solvePercentageRatio(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Direct structured percentage
    // ---------------------------------------------------------

    const directPercentage =
      this.firstFinite(
        structured.calculatedPercentage,
        structured.percentage,
        structured.answerPercentage
      );

    if (
      directPercentage !== null &&
      /percentage|percent|%/i.test(
        normalized
      )
    ) {
      return this.result(
        "percentage-direct",
        "single-value",
        directPercentage,
        {
          percentage:
            directPercentage
        },
        `The percentage is ${this.roundNumber(
          directPercentage
        )}%.`
      );
    }

    // ---------------------------------------------------------
    // Percentage of an amount
    // ---------------------------------------------------------

    const percentageOf =
      normalized.match(
        /(-?\d+(?:\.\d+)?)\s*%\s*(?:of|times)\s*(-?\d+(?:\.\d+)?)/i
      );

    if (
      percentageOf
    ) {
      const percent =
        Number(
          percentageOf[1]
        );

      const amount =
        Number(
          percentageOf[2]
        );

      const value =
        percent *
        amount /
        100;

      return this.result(
        "percentage-of",
        "single-value",
        this.roundNumber(
          value
        ),
        {
          percent,
          amount,
          value
        },
        `${percent}% of ${amount} is ${this.roundNumber(value)}.`
      );
    }

    // ---------------------------------------------------------
    // Fraction to percentage
    // ---------------------------------------------------------

    const fractionPercent =
      normalized.match(
        /(?:convert|write|express).*?(-?\d+)\s*\/\s*(-?\d+).*?(?:as|to)\s*(?:a\s*)?percentage/i
      );

    if (
      fractionPercent
    ) {
      const numerator =
        Number(
          fractionPercent[1]
        );

      const denominator =
        Number(
          fractionPercent[2]
        );

      if (
        denominator !== 0
      ) {
        const percentage =
          numerator /
          denominator *
          100;

        return this.result(
          "fraction-to-percentage",
          "single-value",
          this.roundNumber(
            percentage
          ),
          {
            numerator,
            denominator
          },
          `${numerator}/${denominator} = ${this.roundNumber(
            percentage
          )}%.`
        );
      }
    }

    // ---------------------------------------------------------
    // Percentage change
    // ---------------------------------------------------------

    const percentageChange =
      normalized.match(
        /(?:increase|decrease|change)\s+from\s*(-?\d+(?:\.\d+)?)\s*(?:to|into)\s*(-?\d+(?:\.\d+)?)/i
      );

    if (
      percentageChange
    ) {
      const oldValue =
        Number(
          percentageChange[1]
        );

      const newValue =
        Number(
          percentageChange[2]
        );

      if (
        oldValue !== 0
      ) {
        const percentage =
          (
            (
              newValue -
              oldValue
            ) /
            Math.abs(
              oldValue
            )
          ) *
          100;

        return this.result(
          "percentage-change",
          "single-value",
          this.roundNumber(
            percentage
          ),
          {
            oldValue,
            newValue,
            percentage
          },
          `The percentage change is ${this.roundNumber(
            percentage
          )}%.`
        );
      }
    }

    // ---------------------------------------------------------
    // Ratio simplification
    // ---------------------------------------------------------

    const ratio =
      normalized.match(
        /(?:ratio|proportion)\D*(\d+)\s*:\s*(\d+)/i
      );

    if (
      ratio
    ) {
      const a =
        Number(
          ratio[1]
        );

      const b =
        Number(
          ratio[2]
        );

      if (
        a >= 0 &&
        b >= 0
      ) {
        const divisor =
          this.gcd(
            a,
            b
          );

        const simplified =
          `${a / divisor}:${b / divisor}`;

        return this.result(
          "ratio-simplification",
          "ratio",
          simplified,
          {
            original:
              `${a}:${b}`,
            simplified
          },
          `The simplified ratio is ${simplified}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Proportion
    // Example: 3 : 5 = x : 20
    // ---------------------------------------------------------

    const proportion =
      normalized.match(
        /(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*=\s*x\s*:\s*(\d+(?:\.\d+)?)/i
      );

    if (
      proportion
    ) {
      const a =
        Number(
          proportion[1]
        );

      const b =
        Number(
          proportion[2]
        );

      const d =
        Number(
          proportion[3]
        );

      if (
        b !== 0
      ) {
        const x =
          a *
          d /
          b;

        return this.result(
          "proportion",
          "single-value",
          this.roundNumber(
            x
          ),
          {
            a,
            b,
            d,
            x
          },
          `x = ${this.roundNumber(x)}.`
        );
      }
    }

    return null;
  }

  // ===========================================================
  // UNIT CONVERSION / RATES / COMPOUND MEASURES
  // ===========================================================

  solveUnitsRates(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Structured conversion
    // ---------------------------------------------------------

    if (
      structured.fromValue !==
        undefined &&
      structured.fromUnit &&
      structured.toUnit
    ) {
      const value =
        this.convertUnit(
          Number(
            structured.fromValue
          ),
          structured.fromUnit,
          structured.toUnit
        );

      if (
        value !== null
      ) {
        return this.result(
          "unit-conversion",
          "single-value",
          this.roundNumber(
            value
          ),
          {
            fromValue:
              Number(
                structured.fromValue
              ),
            fromUnit:
              structured.fromUnit,
            toUnit:
              structured.toUnit,
            value
          },
          `${structured.fromValue} ${structured.fromUnit} = ${this.roundNumber(
            value
          )} ${structured.toUnit}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Text conversion
    // ---------------------------------------------------------

    const conversion =
      normalized.match(
        /(?:convert|change|how many)\s+(-?\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s*(?:to|into|in)\s*([a-zA-Z]+)/i
      );

    if (
      conversion
    ) {
      const value =
        Number(
          conversion[1]
        );

      const from =
        conversion[2];

      const to =
        conversion[3];

      const converted =
        this.convertUnit(
          value,
          from,
          to
        );

      if (
        converted !== null
      ) {
        return this.result(
          "unit-conversion",
          "single-value",
          this.roundNumber(
            converted
          ),
          {
            value,
            from,
            to,
            converted
          },
          `${value} ${from} = ${this.roundNumber(
            converted
          )} ${to}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Speed / rate
    // ---------------------------------------------------------

    const speed =
      normalized.match(
        /(-?\d+(?:\.\d+)?)\s*(km|kilometres?|kilometers?|miles?|mi|m)\s*(?:in|over|per|\/)\s*(-?\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?|s)\b/i
      );

    if (
      speed
    ) {
      const distance =
        Number(
          speed[1]
        );

      const distanceUnit =
        speed[2].toLowerCase();

      const time =
        Number(
          speed[3]
        );

      const timeUnit =
        speed[4].toLowerCase();

      let hours =
        time;

      if (
        /^min/.test(
          timeUnit
        )
      ) {
        hours =
          time /
          60;
      }

      if (
        /^sec/.test(
          timeUnit
        ) ||
        timeUnit === "s"
      ) {
        hours =
          time /
          3600;
      }

      if (
        hours > 0
      ) {
        let normalizedDistance =
          distance;

        if (
          /^m$/.test(
            distanceUnit
          )
        ) {
          normalizedDistance =
            distance /
            1000;
        }

        const value =
          normalizedDistance /
          hours;

        return this.result(
          "rate-speed",
          "single-value",
          this.roundNumber(
            value
          ),
          {
            distance,
            distanceUnit,
            time,
            timeUnit,
            speedPerHour:
              value
          },
          `The speed is approximately ${this.roundNumber(
            value
          )} distance-units per hour.`
        );
      }
    }

    // ---------------------------------------------------------
    // Density / pressure / compound measures
    // ---------------------------------------------------------

    const compound =
      structured.compoundMeasure ??
      null;

    if (
      compound &&
      typeof compound ===
        "object"
    ) {
      const numerator =
        this.firstFinite(
          compound.numerator,
          compound.top
        );

      const denominator =
        this.firstFinite(
          compound.denominator,
          compound.bottom
        );

      if (
        numerator !== null &&
        denominator !== null &&
        denominator !== 0
      ) {
        const value =
          numerator /
          denominator;

        return this.result(
          "compound-measure",
          "single-value",
          this.roundNumber(
            value
          ),
          {
            numerator,
            denominator,
            value
          },
          `The compound measure is ${this.roundNumber(
            value
          )}.`
        );
      }
    }

    return null;
  }

  convertUnit(
    value,
    from,
    to
  ) {
    if (
      !Number.isFinite(value) ||
      !from ||
      !to
    ) {
      return null;
    }

    const normalize =
      unit =>
        String(
          unit
        )
          .toLowerCase()
          .replace(
            /²/g,
            "^2"
          )
          .replace(
            /³/g,
            "^3"
          )
          .replace(
            /\s+/g,
            ""
          );

    const a =
      normalize(
        from
      );

    const b =
      normalize(
        to
      );

    // ---------------------------------------------------------
    // Length
    // ---------------------------------------------------------

    const lengthUnits = {
      mm: 0.001,
      millimetre: 0.001,
      millimetres: 0.001,

      cm: 0.01,
      centimetre: 0.01,
      centimetres: 0.01,

      m: 1,
      metre: 1,
      metres: 1,

      km: 1000,
      kilometre: 1000,
      kilometres: 1000,

      in: 0.0254,
      inch: 0.0254,
      inches: 0.0254,

      ft: 0.3048,
      foot: 0.3048,
      feet: 0.3048,

      yd: 0.9144,
      yard: 0.9144,
      yards: 0.9144,

      mile: 1609.344,
      miles: 1609.344,
      mi: 1609.344
    };

    if (
      lengthUnits[a] !==
        undefined &&
      lengthUnits[b] !==
        undefined
    ) {
      return (
        value *
        lengthUnits[a] /
        lengthUnits[b]
      );
    }

    // ---------------------------------------------------------
    // Area
    // ---------------------------------------------------------

    const areaUnits = {
      "mm^2":
        0.000001,

      "cm^2":
        0.0001,

      "m^2":
        1,

      "km^2":
        1000000,

      hectare:
        10000,

      hectares:
        10000
    };

    if (
      areaUnits[a] !==
        undefined &&
      areaUnits[b] !==
        undefined
    ) {
      return (
        value *
        areaUnits[a] /
        areaUnits[b]
      );
    }

    // ---------------------------------------------------------
    // Volume
    // ---------------------------------------------------------

    const volumeUnits = {
      "cm^3":
        0.000001,

      "m^3":
        1,

      litre:
        0.001,

      litres:
        0.001,

      ml:
        0.000001,

      millilitre:
        0.000001,

      millilitres:
        0.000001
    };

    if (
      volumeUnits[a] !==
        undefined &&
      volumeUnits[b] !==
        undefined
    ) {
      return (
        value *
        volumeUnits[a] /
        volumeUnits[b]
      );
    }

    // ---------------------------------------------------------
    // Mass
    // ---------------------------------------------------------

    const massUnits = {
      mg: 0.001,

      g: 1,
      gram: 1,
      grams: 1,

      kg: 1000,
      kilogram: 1000,
      kilograms: 1000,

      tonne: 1000000,
      tonnes: 1000000
    };

    if (
      massUnits[a] !==
        undefined &&
      massUnits[b] !==
        undefined
    ) {
      return (
        value *
        massUnits[a] /
        massUnits[b]
      );
    }

    // ---------------------------------------------------------
    // Time
    // ---------------------------------------------------------

    const timeUnits = {
      ms: 0.001,

      s: 1,
      sec: 1,
      secs: 1,
      second: 1,
      seconds: 1,

      min: 60,
      mins: 60,
      minute: 60,
      minutes: 60,

      h: 3600,
      hr: 3600,
      hrs: 3600,
      hour: 3600,
      hours: 3600,

      day: 86400,
      days: 86400
    };

    if (
      timeUnits[a] !==
        undefined &&
      timeUnits[b] !==
        undefined
    ) {
      return (
        value *
        timeUnits[a] /
        timeUnits[b]
      );
    }

    // ---------------------------------------------------------
    // Temperature
    // ---------------------------------------------------------

    if (
      ["c", "°c", "celsius"].includes(a) &&
      ["f", "°f", "fahrenheit"].includes(b)
    ) {
      return (
        value *
        9 /
        5 +
        32
      );
    }

    if (
      ["f", "°f", "fahrenheit"].includes(a) &&
      ["c", "°c", "celsius"].includes(b)
    ) {
      return (
        (value - 32) *
        5 /
        9
      );
    }

    if (
      ["c", "°c", "celsius"].includes(a) &&
      ["k", "kelvin"].includes(b)
    ) {
      return (
        value +
        273.15
      );
    }

    if (
      ["k", "kelvin"].includes(a) &&
      ["c", "°c", "celsius"].includes(b)
    ) {
      return (
        value -
        273.15
      );
    }

    return null;
  }

  // ===========================================================
  // BASIC NUMBER / PRIME HELPERS
  // ===========================================================

  isPrime(
    number
  ) {
    if (
      !Number.isInteger(
        number
      ) ||
      number < 2
    ) {
      return false;
    }

    if (
      number === 2
    ) {
      return true;
    }

    if (
      number % 2 ===
        0
    ) {
      return false;
    }

    for (
      let divisor = 3;
      divisor * divisor <=
        number;
      divisor += 2
    ) {
      if (
        number %
          divisor ===
          0
      ) {
        return false;
      }
    }

    return true;
  }

  gcd(
    a,
    b
  ) {
    a =
      Math.abs(
        Math.trunc(a)
      );

    b =
      Math.abs(
        Math.trunc(b)
      );

    while (
      b !== 0
    ) {
      const next =
        a % b;

      a =
        b;

      b =
        next;
    }

    return a || 1;
  }

  lcm(
    a,
    b
  ) {
    if (
      a === 0 ||
      b === 0
    ) {
      return 0;
    }

    return Math.abs(
      a *
      b
    ) /
      this.gcd(
        a,
        b
      );
  }

  // ===========================================================
  // RESULT HELPERS
  // ===========================================================

  result(
    method,
    answerModel,
    value,
    analysis,
    explanation
  ) {
    return {
      success: true,
      method,
      answerModel,
      answers: {
        value
      },
      analysis,
      explanation
    };
  }

  firstFinite(
    ...values
  ) {
    for (
      const value of
        values
    ) {
      const number =
        Number(
          value
        );

      if (
        Number.isFinite(
          number
        )
      ) {
        return number;
      }
    }

    return null;
  }

  extractNumbersFromText(
    text
  ) {
    return [
      ...String(
        text
      ).matchAll(
        /-?\d+(?:\.\d+)?/g
      )
    ].map(
      match =>
        Number(
          match[0]
        )
    );
  }

  nearlyEqual(
    a,
    b,
    epsilon = 1e-9
  ) {
    return (
      Math.abs(
        Number(a) -
        Number(b)
      ) <=
      epsilon
    );
  }

  roundNumber(
    value,
    decimals = 6
  ) {
    if (
      !Number.isFinite(
        Number(value)
      )
    ) {
      return value;
    }

    const factor =
      Math.pow(
        10,
        decimals
      );

    return (
      Math.round(
        Number(value) *
        factor
      ) /
      factor
    );
  }

  roundTo(
    value,
    place
  ) {
    if (
      !Number.isFinite(
        value
      ) ||
      !Number.isFinite(
        place
      ) ||
      place === 0
    ) {
      return value;
    }

    return (
      Math.round(
        value /
        place
      ) *
      place
    );
  }

  escapeRegex(
    value
  ) {
    return String(
      value
    ).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }

    // ===========================================================
  // SEQUENCES / PATTERNS
  // ===========================================================

  solveSequence(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Explicit rule + requested term
    // ---------------------------------------------------------

    const rule =
      String(
        structured.rule ??
        structured.formula ??
        structured.equation ??
        ""
      )
        .trim();

    let termNumber =
      this.firstFinite(
        structured.termNumber,
        structured.requestedTerm,
        structured.n
      );

    if (
      termNumber === null
    ) {
      const match =
        normalized.match(
          /(?:work\s*out|find|calculate)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?\s+term/i
        );

      if (match) {
        termNumber =
          Number(
            match[1]
          );
      }
    }

    if (
      rule &&
      termNumber !== null
    ) {
      const expression =
        rule
          .replace(
            /^.*?(?:T\s*\(\s*n\s*\)|a_n|u_n|Tn?)\s*=\s*/i,
            ""
          )
          .replace(
            /\s+/g,
            ""
          )
          .replace(
            /²/g,
            "^2"
          )
          .replace(
            /³/g,
            "^3"
          );

      const value =
        this.evaluateExpressionAtN(
          expression,
          termNumber
        );

      if (
        value !== null
      ) {
        return this.result(
          "sequence-term",
          "single-value",
          value,
          {
            rule:
              expression,
            termNumber,
            value
          },
          `Substituting n = ${termNumber} gives ${value}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Explicit sequence supplied by Gemini
    // ---------------------------------------------------------

    const terms =
      this.extractNumericArray(
        structured.terms ??
        structured.sequence ??
        structured.values
      );

    if (
      terms.length >= 2 &&
      /next\s+(?:term|number)|continue\s+the\s+sequence|sequence/i.test(
        normalized
      )
    ) {
      // Arithmetic sequence
      if (
        terms.length >= 3
      ) {
        const differences =
          terms
            .slice(1)
            .map(
              (
                value,
                index
              ) =>
                value -
                terms[index]
            );

        const arithmetic =
          differences.every(
            difference =>
              this.nearlyEqual(
                difference,
                differences[0]
              )
          );

        if (arithmetic) {
          const next =
            terms[
              terms.length - 1
            ] +
            differences[0];

          return this.result(
            "arithmetic-sequence-next-term",
            "single-value",
            this.roundNumber(
              next
            ),
            {
              terms,
              difference:
                differences[0],
              next
            },
            `The next term is ${this.roundNumber(next)}.`
          );
        }
      }

      // Geometric sequence
      const ratios =
        [];

      for (
        let index = 1;
        index < terms.length;
        index++
      ) {
        if (
          terms[index - 1] === 0
        ) {
          ratios.push(
            NaN
          );
        } else {
          ratios.push(
            terms[index] /
            terms[index - 1]
          );
        }
      }

      if (
        ratios.length > 0 &&
        ratios.every(
          ratio =>
            Number.isFinite(
              ratio
            ) &&
            this.nearlyEqual(
              ratio,
              ratios[0]
            )
        )
      ) {
        const next =
          terms[
            terms.length - 1
          ] *
          ratios[0];

        return this.result(
          "geometric-sequence-next-term",
          "single-value",
          this.roundNumber(
            next
          ),
          {
            terms,
            ratio:
              ratios[0],
            next
          },
          `The next term is ${this.roundNumber(next)}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Pattern described by Gemini
    // ---------------------------------------------------------

    if (
      structured.pattern &&
      structured.nextTerm !==
        undefined
    ) {
      const next =
        Number(
          structured.nextTerm
        );

      if (
        Number.isFinite(
          next
        )
      ) {
        return this.result(
          "pattern-next-term",
          "single-value",
          next,
          {
            pattern:
              structured.pattern,
            nextTerm:
              next
          },
          `The next term is ${next}.`
        );
      }
    }

    return null;
  }

  evaluateExpressionAtN(
    expression,
    n
  ) {
    if (
      !expression ||
      !Number.isFinite(
        Number(n)
      )
    ) {
      return null;
    }

    let safe =
      String(
        expression
      )
        .replace(
          /²/g,
          "^2"
        )
        .replace(
          /³/g,
          "^3"
        )
        .replace(
          /\bn\b/gi,
          `(${Number(n)})`
        )
        .replace(
          /(\([^()]+\)|-?\d+(?:\.\d+)?)\^(\d+(?:\.\d+)?)/g,
          "Math.pow($1,$2)"
        );

    // Support simple multiplication such as 3n.
    safe =
      safe.replace(
        /(\d|\))(?=\()/g,
        "$1*"
      );

    safe =
      safe.replace(
        /(\d|\))(?=\()/g,
        "$1*"
      );

    // Convert remaining exponentiation.
    safe =
      safe.replace(
        /\^/g,
        "**"
      );

    if (
      !/^[0-9+\-*/().\s*]*Math\.pow\([0-9+\-*/().\s,]*\)[0-9+\-*/().\s*]*$/.test(
        safe
      ) &&
      !/^[0-9+\-*/().\s*]+$/.test(
        safe
      )
    ) {
      return null;
    }

    return this.safeArithmetic(
      safe
    );
  }

  // ===========================================================
  // ALGEBRA / EQUATIONS / INEQUALITIES
  // ===========================================================

  solveAlgebra(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // ---------------------------------------------------------
    // Structured substitution
    // ---------------------------------------------------------

    if (
      structured.expression &&
      structured.values &&
      typeof structured.values ===
        "object"
    ) {
      const value =
        this.evaluateExpressionWithVariables(
          structured.expression,
          structured.values
        );

      if (
        value !== null
      ) {
        return this.result(
          "substitution",
          "single-value",
          value,
          {
            expression:
              structured.expression,
            values:
              structured.values
          },
          `After substitution the answer is ${value}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Direct structured equation
    // ---------------------------------------------------------

    const equation =
      String(
        structured.equation ??
        structured.expression ??
        ""
      )
        .replace(
          /\s+/g,
          ""
        );

    if (
      equation &&
      equation.includes("=")
    ) {
      // Simultaneous equations
      if (
        Array.isArray(
          structured.equations
        ) &&
        structured.equations.length >= 2
      ) {
        const simultaneous =
          this.solveSimultaneousEquations(
            structured.equations
          );

        if (
          simultaneous
        ) {
          return this.result(
            "simultaneous-equations",
            "multi-value",
            simultaneous,
            {
              equations:
                structured.equations,
              solution:
                simultaneous
            },
            `The simultaneous-equation solution is x = ${simultaneous.x}, y = ${simultaneous.y}.`
          );
        }
      }

      // Quadratic
      const quadratic =
        this.solveQuadraticEquation(
          equation
        );

      if (
        quadratic
      ) {
        return this.result(
          "quadratic-equation",
          "multi-value",
          quadratic,
          {
            equation,
            roots:
              quadratic
          },
          `The solutions are ${quadratic.join(" and ")}.`
        );
      }

      // Linear
      const linear =
        this.solveLinearEquation(
          equation
        );

      if (
        linear !== null
      ) {
        return this.result(
          "linear-equation",
          "single-value",
          linear,
          {
            equation,
            variable:
              "x"
          },
          `x = ${linear}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Text equation
    // ---------------------------------------------------------

    const textEquation =
      normalized.match(
        /(?:solve|work\s*out|find|calculate)\s+(.+?=[^?]+)/i
      );

    if (
      textEquation
    ) {
      const cleaned =
        textEquation[1]
          .replace(
            /[.,?]+$/g,
            ""
          )
          .replace(
            /\s+/g,
            ""
          );

      const quadratic =
        this.solveQuadraticEquation(
          cleaned
        );

      if (
        quadratic
      ) {
        return this.result(
          "quadratic-equation",
          "multi-value",
          quadratic,
          {
            equation:
              cleaned,
            roots:
              quadratic
          },
          `The solutions are ${quadratic.join(" and ")}.`
        );
      }

      const linear =
        this.solveLinearEquation(
          cleaned
        );

      if (
        linear !== null
      ) {
        return this.result(
          "linear-equation",
          "single-value",
          linear,
          {
            equation:
              cleaned
          },
          `x = ${linear}.`
        );
      }
    }

    // ---------------------------------------------------------
    // Inequality
    // ---------------------------------------------------------

    const inequality =
      equation ||
      this.extractEquationLikeExpression(
        normalized,
        /(?:solve|find|work\s*out)\s+(.+?[<>]=?.*)/i
      );

    if (
      inequality &&
      /[<>]=?/.test(
        inequality
      )
    ) {
      const solution =
        this.solveLinearInequality(
          inequality
        );

      if (
        solution
      ) {
        return this.result(
          "linear-inequality",
          "expression",
          solution,
          {
            inequality,
            solution
          },
          solution
        );
      }
    }

    // ---------------------------------------------------------
    // Indices
    // ---------------------------------------------------------

    const indexMatch =
      normalized.match(
        /(-?\d+(?:\.\d+)?)\s*(?:\^|to the power of)\s*(-?\d+(?:\.\d+)?)/i
      );

    if (
      indexMatch
    ) {
      const base =
        Number(
          indexMatch[1]
        );

      const exponent =
        Number(
          indexMatch[2]
        );

      const value =
        Math.pow(
          base,
          exponent
        );

      return this.result(
        "indices",
        "single-value",
        this.roundNumber(
          value
        ),
        {
          base,
          exponent
        },
        `${base}^${exponent} = ${this.roundNumber(value)}.`
      );
    }

    // ---------------------------------------------------------
    // Expanding
    // ---------------------------------------------------------

    const expandMatch =
      normalized.match(
        /expand.*?\(\s*x\s*([+-])\s*(\d+)\s*\)\s*\(\s*x\s*([+-])\s*(\d+)\s*\)/i
      );

    if (
      expandMatch
    ) {
      const a =
        Number(
          expandMatch[2]
        ) *
        (
          expandMatch[1] === "-"
            ? -1
            : 1
        );

      const b =
        Number(
          expandMatch[4]
        ) *
        (
          expandMatch[3] === "-"
            ? -1
            : 1
        );

      const linear =
        a + b;

      const constant =
        a * b;

      const expression =
        `x^2 ${
          linear >= 0
            ? "+"
            : "-"
        } ${Math.abs(linear)}x ${
          constant >= 0
            ? "+"
            : "-"
        } ${Math.abs(constant)}`;

      return this.result(
        "expanding",
        "expression",
        expression,
        {
          a,
          b,
          linear,
          constant
        },
        expression
      );
    }

    // ---------------------------------------------------------
    // Factorising
    // ---------------------------------------------------------

    const factorMatch =
      normalized.match(
        /factor(?:ise|ize)?.*?x\s*\^?\s*2\s*([+-])\s*(\d+)x\s*([+-])\s*(\d+)/i
      );

    if (
      factorMatch
    ) {
      const b =
        Number(
          factorMatch[2]
        ) *
        (
          factorMatch[1] === "-"
            ? -1
            : 1
        );

      const c =
        Number(
          factorMatch[4]
        ) *
        (
          factorMatch[3] === "-"
            ? -1
            : 1
        );

      for (
        let first = -100;
        first <= 100;
        first++
      ) {
        if (
          first === 0 ||
          c % first !== 0
        ) {
          continue;
        }

        const second =
          c /
          first;

        if (
          first +
            second ===
            b
        ) {
          const expression =
            `(x ${
              first >= 0
                ? "+"
                : "-"
            } ${Math.abs(first)})(x ${
              second >= 0
                ? "+"
                : "-"
            } ${Math.abs(second)})`;

          return this.result(
            "factorising",
            "expression",
            expression,
            {
              b,
              c,
              factors: [
                first,
                second
              ]
            },
            expression
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Simplification
    // ---------------------------------------------------------

    if (
      /simplify|simplifying/i.test(
        normalized
      )
    ) {
      const expression =
        this.extractArithmeticExpression(
          normalized
        );

      if (
        expression
      ) {
        const value =
          this.safeArithmetic(
            expression
          );

        if (
          value !== null
        ) {
          return this.result(
            "simplifying",
            "single-value",
            value,
            {
              expression
            },
            `The simplified value is ${value}.`
          );
        }
      }
    }

    return null;
  }

  evaluateExpressionWithVariables(
    expression,
    values
  ) {
    let result =
      String(
        expression
      );

    result =
      result.replace(
        /\^/g,
        "**"
      );

    for (
      const [
        variable,
        value
      ] of Object.entries(
        values
      )
    ) {
      const numeric =
        Number(
          value
        );

      if (
        !Number.isFinite(
          numeric
        )
      ) {
        return null;
      }

      result =
        result.replace(
          new RegExp(
            `\\b${this.escapeRegex(variable)}\\b`,
            "g"
          ),
          `(${numeric})`
        );
    }

    return this.safeArithmetic(
      result
    );
  }

  extractEquationLikeExpression(
    text,
    pattern
  ) {
    if (!text || !pattern) {
      return null;
    }

    const match =
      String(
        text
      ).match(
        pattern
      );

    if (!match) {
      return null;
    }

    return String(
      match[1] ?? ""
    )
      .replace(
        /[.,?]+$/g,
        ""
      )
      .replace(
        /\s+/g,
        ""
      );
  }

    // ===========================================================
  // LINEAR EQUATION
  // ===========================================================

  solveLinearEquation(
    equation
  ) {
    if (!equation) {
      return null;
    }

    const cleaned =
      String(equation)
        .replace(
          /[−–—]/g,
          "-"
        )
        .replace(
          /\s+/g,
          ""
        );

    const parts =
      cleaned.split("=");

    if (
      parts.length !== 2
    ) {
      return null;
    }

    const left =
      this.linearCoefficients(
        parts[0]
      );

    const right =
      this.linearCoefficients(
        parts[1]
      );

    if (
      !left ||
      !right
    ) {
      return null;
    }

    const coefficient =
      left.a -
      right.a;

    const constant =
      right.b -
      left.b;

    if (
      coefficient === 0
    ) {
      return null;
    }

    const solution =
      constant /
      coefficient;

    return Number.isFinite(
      solution
    )
      ? this.roundNumber(
          solution
        )
      : null;
  }

  // ===========================================================
  // LINEAR COEFFICIENT PARSER
  // ===========================================================

  linearCoefficients(
    expression
  ) {
    const cleaned =
      String(
        expression ?? ""
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /−/g,
          "-"
        );

    if (!cleaned) {
      return null;
    }

    let a = 0;
    let b = 0;

    const normalized =
      cleaned
        .replace(
          /^-/,
          "0-"
        )
        .replace(
          /-/g,
          "+-"
        );

    const terms =
      normalized
        .split("+")
        .filter(Boolean);

    for (
      let term of terms
    ) {
      if (
        term.includes("x")
      ) {
        term =
          term.replace(
            /\*x/g,
            "x"
          );

        const coefficientText =
          term.replace(
            /x/g,
            ""
          );

        if (
          coefficientText === "" ||
          coefficientText === "+"
        ) {
          a += 1;
          continue;
        }

        if (
          coefficientText === "-"
        ) {
          a -= 1;
          continue;
        }

        const coefficient =
          Number(
            coefficientText
          );

        if (
          !Number.isFinite(
            coefficient
          )
        ) {
          return null;
        }

        a += coefficient;
      } else {
        const constant =
          Number(
            term
          );

        if (
          !Number.isFinite(
            constant
          )
        ) {
          return null;
        }

        b += constant;
      }
    }

    return {
      a,
      b
    };
  }

  // ===========================================================
  // QUADRATIC EQUATIONS
  // ===========================================================

  solveQuadraticEquation(
    equation
  ) {
    if (!equation) {
      return null;
    }

    const cleaned =
      String(
        equation
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /²/g,
          "^2"
        )
        .replace(
          /−/g,
          "-"
        );

    const parts =
      cleaned.split("=");

    if (
      parts.length !== 2
    ) {
      return null;
    }

    const left =
      this.quadraticCoefficients(
        parts[0]
      );

    const right =
      this.quadraticCoefficients(
        parts[1]
      );

    if (
      !left ||
      !right
    ) {
      return null;
    }

    const a =
      left.a -
      right.a;

    const b =
      left.b -
      right.b;

    const c =
      left.c -
      right.c;

    if (
      Math.abs(a) <
      1e-12
    ) {
      return null;
    }

    const discriminant =
      b * b -
      4 * a * c;

    if (
      discriminant < 0
    ) {
      return null;
    }

    if (
      Math.abs(discriminant) <
      1e-12
    ) {
      return [
        this.roundNumber(
          -b /
            (2 * a)
        )
      ];
    }

    const sqrt =
      Math.sqrt(
        discriminant
      );

    const roots = [
      this.roundNumber(
        (-b + sqrt) /
          (2 * a)
      ),
      this.roundNumber(
        (-b - sqrt) /
          (2 * a)
      )
    ];

    return roots.sort(
      (x, y) =>
        x - y
    );
  }

  quadraticCoefficients(
    expression
  ) {
    let cleaned =
      String(
        expression ?? ""
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /²/g,
          "^2"
        );

    if (!cleaned) {
      return null;
    }

    cleaned =
      cleaned
        .replace(
          /^-/,
          "0-"
        )
        .replace(
          /-/g,
          "+-"
        );

    const terms =
      cleaned
        .split("+")
        .filter(Boolean);

    let a = 0;
    let b = 0;
    let c = 0;

    for (
      const term of terms
    ) {
      if (
        /x\^2/i.test(
          term
        )
      ) {
        const coefficient =
          term
            .replace(
              /x\^2/gi,
              ""
            );

        if (
          coefficient === "" ||
          coefficient === "+"
        ) {
          a += 1;
        } else if (
          coefficient === "-"
        ) {
          a -= 1;
        } else {
          const value =
            Number(
              coefficient
            );

          if (
            !Number.isFinite(
              value
            )
          ) {
            return null;
          }

          a += value;
        }
      } else if (
        /x/i.test(
          term
        )
      ) {
        const coefficient =
          term
            .replace(
              /x/gi,
              ""
            );

        if (
          coefficient === "" ||
          coefficient === "+"
        ) {
          b += 1;
        } else if (
          coefficient === "-"
        ) {
          b -= 1;
        } else {
          const value =
            Number(
              coefficient
            );

          if (
            !Number.isFinite(
              value
            )
          ) {
            return null;
          }

          b += value;
        }
      } else {
        const value =
          Number(
            term
          );

        if (
          !Number.isFinite(
            value
          )
        ) {
          return null;
        }

        c += value;
      }
    }

    return {
      a,
      b,
      c
    };
  }

  // ===========================================================
  // LINEAR INEQUALITIES
  // ===========================================================

  solveLinearInequality(
    inequality
  ) {
    if (!inequality) {
      return null;
    }

    const match =
      String(
        inequality
      ).match(
        /^(.+?)(<=|>=|<|>)(.+)$/
      );

    if (!match) {
      return null;
    }

    const left =
      this.linearCoefficients(
        match[1]
      );

    const right =
      this.linearCoefficients(
        match[3]
      );

    if (
      !left ||
      !right
    ) {
      return null;
    }

    const operator =
      match[2];

    const coefficient =
      left.a -
      right.a;

    const constant =
      right.b -
      left.b;

    if (
      coefficient === 0
    ) {
      return null;
    }

    let value =
      constant /
      coefficient;

    value =
      this.roundNumber(
        value
      );

    let finalOperator =
      operator;

    if (
      coefficient < 0
    ) {
      const reverse = {
        "<": ">",
        ">": "<",
        "<=": ">=",
        ">=": "<="
      };

      finalOperator =
        reverse[
          operator
        ];
    }

    return `x ${finalOperator} ${value}`;
  }

  // ===========================================================
  // TRIGONOMETRY
  // ===========================================================

  solveTrigonometry(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    const directValue =
      this.firstFinite(
        structured.calculatedValue,
        structured.answer,
        structured.value
      );

    if (
      directValue !== null &&
      /sin|cos|tan|trigonometry|angle/i.test(
        normalized
      )
    ) {
      return this.result(
        "trigonometry",
        "single-value",
        this.roundNumber(
          directValue
        ),
        structured,
        `The trigonometric answer is ${this.roundNumber(directValue)}.`
      );
    }

    const match =
      normalized.match(
        /\b(sin|cos|tan)\s*\(\s*(-?\d+(?:\.\d+)?)\s*(?:°|degrees?)?\s*\)/i
      );

    if (
      match
    ) {
      const fn =
        match[1].toLowerCase();

      const angle =
        Number(
          match[2]
        );

      const radians =
        angle *
        Math.PI /
        180;

      let value;

      if (
        fn === "sin"
      ) {
        value =
          Math.sin(
            radians
          );
      } else if (
        fn === "cos"
      ) {
        value =
          Math.cos(
            radians
          );
      } else {
        value =
          Math.tan(
            radians
          );
      }

      return this.result(
        "trigonometry-direct",
        "single-value",
        this.roundNumber(
          value
        ),
        {
          function:
            fn,
          angle,
          radians
        },
        `${fn}(${angle}°) = ${this.roundNumber(value)}.`
      );
    }

    return null;
  }

  // ===========================================================
  // COORDINATES / GRADIENT / INTERCEPTS
  // ===========================================================

  solveCoordinates(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    const points =
      this.extractPoints(
        structured
      );

    // Midpoint
    if (
      points.length >= 2 &&
      /midpoint/i.test(
        normalized
      )
    ) {
      const a =
        points[0];

      const b =
        points[1];

      const midpoint = {
        x:
          (a.x + b.x) /
          2,
        y:
          (a.y + b.y) /
          2
      };

      return this.result(
        "midpoint",
        "coordinate",
        midpoint,
        {
          pointA:
            a,
          pointB:
            b,
          midpoint
        },
        `The midpoint is (${midpoint.x}, ${midpoint.y}).`
      );
    }

    // Distance
    if (
      points.length >= 2 &&
      /distance|length of segment/i.test(
        normalized
      )
    ) {
      const a =
        points[0];

      const b =
        points[1];

      const distance =
        Math.hypot(
          b.x - a.x,
          b.y - a.y
        );

      return this.result(
        "coordinate-distance",
        "single-value",
        this.roundNumber(
          distance
        ),
        {
          pointA:
            a,
          pointB:
            b,
          distance
        },
        `The distance is ${this.roundNumber(distance)}.`
      );
    }

    // Gradient from points
    if (
      points.length >= 2 &&
      /gradient|slope/i.test(
        normalized
      )
    ) {
      const a =
        points[0];

      const b =
        points[1];

      const dx =
        b.x -
        a.x;

      if (
        dx !== 0
      ) {
        const gradient =
          (
            b.y -
            a.y
          ) /
          dx;

        return this.result(
          "gradient-from-points",
          "single-value",
          this.roundNumber(
            gradient
          ),
          {
            pointA:
              a,
            pointB:
              b,
            gradient
          },
          `The gradient is ${this.roundNumber(gradient)}.`
        );
      }
    }

    const equation =
      String(
        structured.equation ??
        ""
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /[−–—]/g,
          "-"
        );

    if (
      equation &&
      /gradient|slope/i.test(
        normalized
      )
    ) {
      const gradient =
        this.extractGradient(
          equation
        );

      if (
        gradient !== null
      ) {
        return this.result(
          "gradient-from-equation",
          "single-value",
          gradient,
          {
            equation,
            gradient
          },
          `The gradient is ${gradient}.`
        );
      }
    }

    if (
      equation &&
      /intercept|y-intercept/i.test(
        normalized
      )
    ) {
      const intercept =
        this.extractIntercept(
          equation
        );

      if (
        intercept !== null
      ) {
        return this.result(
          "y-intercept",
          "single-value",
          intercept,
          {
            equation,
            intercept
          },
          `The y-intercept is ${intercept}.`
        );
      }
    }

    return null;
  }

  extractGradient(
    equation
  ) {
    const cleaned =
      String(
        equation ?? ""
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /[−–—]/g,
          "-"
        );

    // y = mx + c
    const match =
      cleaned.match(
        /^y=([+-]?\d*\.?\d*)x(?:[+-]\d+(?:\.\d+)?)?$/
      );

    if (
      match
    ) {
      if (
        match[1] === "" ||
        match[1] === "+"
      ) {
        return 1;
      }

      if (
        match[1] === "-"
      ) {
        return -1;
      }

      const value =
        Number(
          match[1]
        );

      return Number.isFinite(
        value
      )
        ? value
        : null;
    }

    return null;
  }

  extractIntercept(
    equation
  ) {
    const cleaned =
      String(
        equation ?? ""
      )
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /[−–—]/g,
          "-"
        );

    const match =
      cleaned.match(
        /^y=[+-]?\d*\.?\d*x([+-]\d+(?:\.\d+)?)$/
      );

    if (
      match
    ) {
      return Number(
        match[1]
      );
    }

    if (
      /^y=/.test(
        cleaned
      ) &&
      this.extractGradient(
        cleaned
      ) !== null
    ) {
      return 0;
    }

    return null;
  }

  // ===========================================================
  // TRANSFORMATIONS / SYMMETRY / VECTORS
  // ===========================================================

  solveTransformations(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    const point =
      structured.point ??
      structured.coordinate ??
      null;

    // Reflection
    if (
      point &&
      /reflection|reflect/i.test(
        normalized
      )
    ) {
      const x =
        Number(
          point.x
        );

      const y =
        Number(
          point.y
        );

      if (
        Number.isFinite(x) &&
        Number.isFinite(y)
      ) {
        let reflected;

        if (
          /x-axis/i.test(
            normalized
          )
        ) {
          reflected = {
            x,
            y:
              -y
          };
        } else if (
          /y-axis/i.test(
            normalized
          )
        ) {
          reflected = {
            x:
              -x,
            y
          };
        } else if (
          /y\s*=\s*x/i.test(
            normalized
          )
        ) {
          reflected = {
            x:
              y,
            y:
              x
          };
        } else if (
          /y\s*=\s*-x/i.test(
            normalized
          )
        ) {
          reflected = {
            x:
              -y,
            y:
              -x
          };
        } else {
          return null;
        }

        return this.result(
          "reflection",
          "coordinate",
          reflected,
          {
            original:
              point,
            reflected
          },
          `The reflected point is (${reflected.x}, ${reflected.y}).`
        );
      }
    }

    // Rotation
    if (
      point &&
      /rotation|rotate/i.test(
        normalized
      )
    ) {
      const x =
        Number(
          point.x
        );

      const y =
        Number(
          point.y
        );

      const angle =
        this.firstFinite(
          structured.angle,
          structured.rotation
        );

      if (
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        angle !== null
      ) {
        const radians =
          angle *
          Math.PI /
          180;

        const rotated = {
          x:
            this.roundNumber(
              x *
                Math.cos(
                  radians
                ) -
              y *
                Math.sin(
                  radians
                )
            ),

          y:
            this.roundNumber(
              x *
                Math.sin(
                  radians
                ) +
              y *
                Math.cos(
                  radians
                )
            )
        };

        return this.result(
          "rotation",
          "coordinate",
          rotated,
          {
            point,
            angle,
            rotated
          },
          `The rotated point is (${rotated.x}, ${rotated.y}).`
        );
      }
    }

    // Symmetry
    const symmetry =
      this.firstFinite(
        structured.orderOfSymmetry,
        structured.symmetryOrder
      );

    if (
      symmetry !== null &&
      /symmetry/i.test(
        normalized
      )
    ) {
      return this.result(
        "symmetry-order",
        "single-value",
        symmetry,
        {
          symmetryOrder:
            symmetry
        },
        `The order of symmetry is ${symmetry}.`
      );
    }

    // Vector
    if (
      /vector/i.test(
        normalized
      )
    ) {
      const vector =
        structured.vector;

      if (
        Array.isArray(
          vector
        ) &&
        vector.length >= 2
      ) {
        return this.result(
          "vector",
          "vector",
          vector,
          {
            vector
          },
          `The vector is (${vector.join(", ")}).`
        );
      }
    }

    return null;
  }

  // ===========================================================
  // NUMBER SKILLS
  // ===========================================================

  solveNumberSkills(
    visualData,
    normalized
  ) {
    const structured =
      visualData?.structuredData ??
      {};

    // Standard form
    if (
      /standard form|scientific notation/i.test(
        normalized
      )
    ) {
      const value =
        this.firstFinite(
          structured.value,
          structured.number
        );

      if (
        value !== null
      ) {
        const standard =
          this.toStandardForm(
            value
          );

        return this.result(
          "standard-form",
          "expression",
          standard,
          {
            value,
            standard
          },
          `${value} in standard form is ${standard}.`
        );
      }
    }

    // Rounding
    const roundingTargets = [
      ...normalized.matchAll(
        /nearest\s+(10|100|1000|10000|100000|1000000|thousand|hundred|million)/gi
      )
    ].map(
      match => {
        const word =
          match[1]
            .toLowerCase();

        const mapping = {
          hundred:
            100,
          thousand:
            1000,
          million:
            1000000
        };

        return (
          mapping[word] ??
          Number(
            word
          )
        );
      }
    );

    if (
      roundingTargets.length > 0
    ) {
      const values =
        this.extractNumbersFromText(
          normalized
        );

      if (
        values.length > 0
      ) {
        const source =
          values[
            values.length - 1
          ];

        const rounded =
          {};

        for (
          const target of
            roundingTargets
        ) {
          rounded[
            target
          ] =
            this.roundTo(
              source,
              target
            );
        }

        return this.result(
          "rounding",
          "multi-value",
          rounded,
          {
            source,
            targets:
              roundingTargets,
            rounded
          },
          `Rounded ${source} to the requested place value.`
        );
      }
    }

    // Bounds
    const bounds =
      structured.bounds ??
      null;

    if (
      bounds &&
      /bounds|upper bound|lower bound/i.test(
        normalized
      )
    ) {
      const lower =
        this.firstFinite(
          bounds.lower,
          bounds.lowerBound
        );

      const upper =
        this.firstFinite(
          bounds.upper,
          bounds.upperBound
        );

      if (
        lower !== null &&
        upper !== null
      ) {
        return this.result(
          "bounds",
          "interval",
          {
            lower,
            upper
          },
          bounds,
          `The bounds are ${lower} to ${upper}.`
        );
      }
    }

    // Estimation
    if (
      /estimate|estimation|approximate/i.test(
        normalized
      )
    ) {
      const expression =
        this.extractArithmeticExpression(
          normalized
        );

      if (
        expression
      ) {
        const value =
          this.safeArithmetic(
            expression
          );

        if (
          value !== null
        ) {
          return this.result(
            "estimation",
            "single-value",
            value,
            {
              expression,
              approximate:
                value
            },
            `The estimated value is approximately ${value}.`
          );
        }
      }
    }

    return null;
  }

  toStandardForm(
    value
  ) {
    if (
      value === 0
    ) {
      return "0";
    }

    const exponent =
      Math.floor(
        Math.log10(
          Math.abs(
            value
          )
        )
      );

    const coefficient =
      value /
      Math.pow(
        10,
        exponent
      );

    return (
      `${this.roundNumber(coefficient)} × 10^${exponent}`
    );
  }

  // ===========================================================
  // HELPERS
  // ===========================================================

  result(
    method,
    answerModel,
    value,
    analysis,
    explanation
  ) {
    return {
      success:
        true,

      method,

      answerModel,

      answers: {
        value
      },

      analysis,

      explanation
    };
  }

  firstFinite(
    ...values
  ) {
    for (
      const value of
        values
    ) {
      const number =
        Number(
          value
        );

      if (
        Number.isFinite(
          number
        )
      ) {
        return number;
      }
    }

    return null;
  }

  extractNumbersFromText(
    text
  ) {
    return [
      ...String(
        text ?? ""
      ).matchAll(
        /-?\d+(?:\.\d+)?/g
      )
    ].map(
      match =>
        Number(
          match[0]
        )
    );
  }

  extractNumericArray(
    value
  ) {
    if (
      !Array.isArray(
        value
      )
    ) {
      return [];
    }

    return value
      .map(
        item => {
          if (
            typeof item ===
            "number"
          ) {
            return item;
          }

          if (
            typeof item ===
              "string" &&
            item.trim() !==
              ""
          ) {
            return Number(
              item
            );
          }

          if (
            item &&
            typeof item ===
              "object"
          ) {
            return Number(
              item.value ??
              item.y ??
              item.number ??
              item.frequency
            );
          }

          return NaN;
        }
      )
      .filter(
        Number.isFinite
      );
  }

  extractPoints(
    structured
  ) {
    const result =
      [];

    const sources = [
      structured?.dataPoints,
      structured?.points,
      structured?.coordinates,
      structured?.diagram?.elements,
      structured?.series
    ];

    for (
      const source of
        sources
    ) {
      if (
        !Array.isArray(
          source
        )
      ) {
        continue;
      }

      for (
        const item of
          source
      ) {
        if (
          Array.isArray(
            item
          ) &&
          item.length >=
            2
        ) {
          const x =
            Number(
              item[0]
            );

          const y =
            Number(
              item[1]
            );

          if (
            Number.isFinite(x) &&
            Number.isFinite(y)
          ) {
            result.push({
              x,
              y,
              label:
                null
            });
          }

          continue;
        }

        if (
          !item ||
          typeof item !==
            "object"
        ) {
          continue;
        }

        if (
          Array.isArray(
            item.coordinates
          ) &&
          item.coordinates.length >=
            2
        ) {
          const x =
            Number(
              item.coordinates[0]
            );

          const y =
            Number(
              item.coordinates[1]
            );

          if (
            Number.isFinite(x) &&
            Number.isFinite(y)
          ) {
            result.push({
              x,
              y,
              label:
                item.label ??
                null
            });
          }

          continue;
        }

        const x =
          Number(
            item.x ??
            item.journeys ??
            item.coordinateX
          );

        const y =
          Number(
            item.y ??
            item.distance_miles ??
            item.distance ??
            item.value ??
            item.coordinateY
          );

        if (
          Number.isFinite(x) &&
          Number.isFinite(y)
        ) {
          result.push({
            x,
            y,
            label:
              item.label ??
              null
          });
        }
      }
    }

    return result;
  }

  mean(
    values
  ) {
    if (
      !values.length
    ) {
      return null;
    }

    return (
      values.reduce(
        (
          sum,
          value
        ) =>
          sum +
          value,
        0
      ) /
      values.length
    );
  }

  median(
    values
  ) {
    if (
      !values.length
    ) {
      return null;
    }

    const sorted =
      [
        ...values
      ].sort(
        (
          a,
          b
        ) =>
          a -
          b
      );

    const middle =
      Math.floor(
        sorted.length /
          2
      );

    if (
      sorted.length %
        2 ===
      0
    ) {
      return (
        sorted[
          middle - 1
        ] +
        sorted[
          middle
        ]
      ) /
      2;
    }

    return sorted[
      middle
    ];
  }

  gcd(
    a,
    b
  ) {
    a =
      Math.abs(
        Math.trunc(
          a
        )
      );

    b =
      Math.abs(
        Math.trunc(
          b
        )
      );

    while (
      b !== 0
    ) {
      const next =
        a %
        b;

      a = b;
      b = next;
    }

    return a || 1;
  }

  simplifyFraction(
    numerator,
    denominator
  ) {
    if (
      denominator ===
      0
    ) {
      return {
        numerator,
        denominator
      };
    }

    const divisor =
      this.gcd(
        Math.abs(
          numerator
        ),
        Math.abs(
          denominator
        )
      );

    let a =
      numerator /
      divisor;

    let b =
      denominator /
      divisor;

    if (
      b < 0
    ) {
      a *= -1;
      b *= -1;
    }

    return {
      numerator:
        a,
      denominator:
        b
    };
  }

  parseFraction(
    value
  ) {
    const match =
      String(
        value ?? ""
      ).match(
        /^\s*(-?\d+)\s*\/\s*(-?\d+)\s*$/
      );

    if (!match) {
      return null;
    }

    const numerator =
      Number(
        match[1]
      );

    const denominator =
      Number(
        match[2]
      );

    if (
      denominator ===
      0
    ) {
      return null;
    }

    return {
      numerator,
      denominator
    };
  }

  findEquivalentFractionCards(
    numerator,
    denominator,
    cards
  ) {
    if (
      !Number.isFinite(
        numerator
      ) ||
      !Number.isFinite(
        denominator
      ) ||
      !Array.isArray(
        cards
      )
    ) {
      return null;
    }

    for (
      const multiplier of
        cards
    ) {
      if (
        !Number.isInteger(
          multiplier
        ) ||
        multiplier <=
          0
      ) {
        continue;
      }

      const candidateNumerator =
        numerator *
        multiplier;

      const candidateDenominator =
        denominator *
        multiplier;

      if (
        cards.includes(
          candidateNumerator
        ) &&
        cards.includes(
          candidateDenominator
        )
      ) {
        return {
          numerator:
            candidateNumerator,
          denominator:
            candidateDenominator,
          multiplier
        };
      }
    }

    return null;
  }

  isPrime(
    number
  ) {
    if (
      !Number.isInteger(
        number
      ) ||
      number <
        2
    ) {
      return false;
    }

    if (
      number ===
      2
    ) {
      return true;
    }

    if (
      number %
        2 ===
      0
    ) {
      return false;
    }

    for (
      let divisor = 3;
      divisor *
        divisor <=
        number;
      divisor += 2
    ) {
      if (
        number %
          divisor ===
        0
      ) {
        return false;
      }
    }

    return true;
  }

  chooseBestFitGraph(
    options
  ) {
    if (
      !Array.isArray(
        options
      ) ||
      !options.length
    ) {
      return null;
    }

    const positivePatterns = [
      /central/i,
      /main trend/i,
      /best fit/i,
      /closely following/i,
      /follows? the trend/i
    ];

    const negativePatterns = [
      /negative slope/i,
      /shifted above/i,
      /too shallow/i,
      /too steep/i,
      /does not match/i,
      /away from/i
    ];

    let best =
      null;

    let bestScore =
      -Infinity;

    for (
      const option of
        options
    ) {
      if (
        !option ||
        !option.label
      ) {
        continue;
      }

      const description =
        String(
          option.lineDescription ??
          option.description ??
          ""
        );

      let score =
        0;

      for (
        const pattern of
          positivePatterns
      ) {
        if (
          pattern.test(
            description
          )
        ) {
          score +=
            10;
        }
      }

      for (
        const pattern of
          negativePatterns
      ) {
        if (
          pattern.test(
            description
          )
        ) {
          score -=
            8;
        }
      }

      if (
        score >
        bestScore
      ) {
        bestScore =
          score;

        best =
          option;
      }
    }

    return bestScore >
      0
      ? best
      : null;
  }

  nearlyEqual(
    a,
    b,
    epsilon = 1e-9
  ) {
    return (
      Math.abs(
        Number(a) -
        Number(b)
      ) <=
      epsilon
    );
  }

  roundNumber(
    value,
    decimals = 6
  ) {
    if (
      !Number.isFinite(
        Number(value)
      )
    ) {
      return value;
    }

    const factor =
      Math.pow(
        10,
        decimals
      );

    return (
      Math.round(
        Number(value) *
          factor
      ) /
      factor
    );
  }

  roundTo(
    value,
    place
  ) {
    if (
      !Number.isFinite(
        value
      ) ||
      !Number.isFinite(
        place
      ) ||
      place ===
        0
    ) {
      return value;
    }

    return (
      Math.round(
        value /
          place
      ) *
      place
    );
  }

  escapeRegex(
    value
  ) {
    return String(
      value
    ).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }
}

export default QuestionSolver;