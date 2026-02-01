#!/usr/bin/env tsx

/**
 * Format Storybook Vitest interaction test results into an LLM-friendly format
 *
 * This script reads the verbose JSON output from test-storybook and creates
 * a concise summary focused on failures and actionable information.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";

type TestResult = {
	name: string;
	status: "passed" | "failed";
	assertionResults: Array<{
		fullName: string;
		title: string;
		status: "passed" | "failed";
		duration?: number;
		failureMessages: string[];
	}>;
};

type VitestReport = {
	numTotalTestSuites: number;
	numPassedTestSuites: number;
	numFailedTestSuites: number;
	numTotalTests: number;
	numPassedTests: number;
	numFailedTests: number;
	success: boolean;
	testResults: TestResult[];
};

const formatTestResults = ({
	inputPath,
	outputPath,
}: {
	inputPath: string;
	outputPath: string;
}) => {
	if (!existsSync(inputPath)) {
		console.error(`❌ Test results not found at ${inputPath}`);
		return;
	}

	const rawJson = readFileSync(inputPath, "utf-8");
	const report: VitestReport = JSON.parse(rawJson);

	const output: string[] = [];

	// Summary
	output.push("# Interaction Test Results\n");
	output.push(`**Status**: ${report.success ? "✅ PASSED" : "❌ FAILED"}\n`);
	output.push("## Summary");
	output.push(
		`- Test Suites: ${report.numPassedTestSuites}/${report.numTotalTestSuites} passed`,
	);
	output.push(
		`- Tests: ${report.numPassedTests}/${report.numTotalTests} passed`,
	);
	output.push("");

	// Failed tests (if any)
	if (report.numFailedTests > 0) {
		output.push("## Failed Tests\n");

		const failedSuites = report.testResults.filter(
			(suite) => suite.status === "failed",
		);

		for (const suite of failedSuites) {
			const failedTests = suite.assertionResults.filter(
				(test) => test.status === "failed",
			);

			if (failedTests.length === 0) continue;

			output.push(
				`### ${suite.name.replace(/.*\/packages\/yaboujee\//, "yaboujee/").replace(/.*\/apps\/index-pdf-frontend\//, "frontend/")}`,
			);
			output.push("");

			for (const test of failedTests) {
				output.push(`#### ❌ ${test.title}`);
				output.push("");

				// Extract the most relevant error message
				if (test.failureMessages.length > 0) {
					const errorMsg = test.failureMessages[0];

					// Try to extract the actual error (before the stack trace)
					const lines = errorMsg.split("\n");
					const errorLines: string[] = [];

					for (const line of lines) {
						// Stop at stack trace
						if (line.trim().startsWith("at ") && line.includes("http://"))
							break;
						errorLines.push(line);
					}

					const cleanError = errorLines
						.join("\n")
						.trim()
						// Remove excessive whitespace
						.replace(/\n{3,}/g, "\n\n");

					output.push("```");
					output.push(cleanError);
					output.push("```");
					output.push("");
				}
			}
		}
	}

	// Success message
	if (report.success) {
		output.push("## ✅ All tests passed!");
	}

	const formatted = output.join("\n");
	writeFileSync(outputPath, formatted, "utf-8");

	console.log(`\n📊 Formatted test results written to: ${outputPath}`);

	if (!report.success) {
		console.log(`\n❌ ${report.numFailedTests} test(s) failed`);
	}
};

// Main execution
const args = process.argv.slice(2);
if (args.length < 2) {
	console.error(
		"Usage: format-interaction-test-results.ts <input-json> <output-md>",
	);
	process.exit(1);
}

formatTestResults({
	inputPath: args[0],
	outputPath: args[1],
});
