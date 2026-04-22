#!/usr/bin/env tsx

import { existsSync, readFileSync, writeFileSync } from "node:fs";

type AssertionResult = {
	fullName: string;
	title: string;
	status: "passed" | "failed";
	duration?: number;
	failureMessages: string[];
};

type TestResult = {
	name: string;
	status: "passed" | "failed";
	assertionResults: AssertionResult[];
};

type VitestReport = {
	numTotalTestSuites: number;
	numPassedTestSuites: number;
	numFailedTestSuites: number;
	numPendingTestSuites?: number;
	numTotalTests: number;
	numPassedTests: number;
	numFailedTests: number;
	numPendingTests?: number;
	numTodoTests?: number;
	success: boolean;
	testResults: TestResult[];
};

const shortenSuitePath = (suiteName: string): string =>
	suiteName
		.replace(/.*\/apps\/index-pdf-frontend\//, "apps/index-pdf-frontend/")
		.replace(/.*\/apps\/index-pdf-backend\//, "apps/index-pdf-backend/")
		.replace(/.*\/packages\/([^/]+)\//, "packages/$1/")
		.replace(/.*\/db\//, "db/");

const extractUsefulError = (failureMessage: string): string => {
	const lines = failureMessage.split("\n");
	const out: string[] = [];

	for (const line of lines) {
		// Stop early at stack trace
		if (line.trim().startsWith("at ")) break;
		out.push(line);
	}

	return out
		.join("\n")
		.trim()
		.replace(/\n{3,}/g, "\n\n");
};

const formatUnitTestResults = ({
	inputPath,
	outputPath,
}: {
	inputPath: string;
	outputPath: string;
}) => {
	if (!existsSync(inputPath)) {
		console.error(`❌ Unit test results not found at ${inputPath}`);
		return;
	}

	const report: VitestReport = JSON.parse(readFileSync(inputPath, "utf-8"));

	const output: string[] = [];
	output.push("# Unit Test Results\n");
	output.push(`**Status**: ${report.success ? "✅ PASSED" : "❌ FAILED"}\n`);

	output.push("## Summary");
	output.push(
		`- Test Suites: ${report.numPassedTestSuites}/${report.numTotalTestSuites} passed`,
	);
	output.push(
		`- Tests: ${report.numPassedTests}/${report.numTotalTests} passed`,
	);

	if (
		typeof report.numPendingTests === "number" &&
		report.numPendingTests > 0
	) {
		output.push(`- Pending: ${report.numPendingTests}`);
	}

	if (typeof report.numTodoTests === "number" && report.numTodoTests > 0) {
		output.push(`- Todo: ${report.numTodoTests}`);
	}

	output.push("");

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

			output.push(`### ${shortenSuitePath(suite.name)}`);
			output.push("");

			for (const test of failedTests) {
				output.push(`#### ❌ ${test.title}`);
				output.push("");

				if (test.failureMessages.length > 0) {
					output.push("```");
					output.push(extractUsefulError(test.failureMessages[0]));
					output.push("```");
					output.push("");
				}
			}
		}
	}

	// Helpful for flaky/perf investigations
	const testsWithDuration: Array<{
		suite: string;
		test: AssertionResult;
	}> = [];

	for (const suite of report.testResults) {
		for (const test of suite.assertionResults) {
			if (typeof test.duration === "number") {
				testsWithDuration.push({ suite: suite.name, test });
			}
		}
	}

	const slowest = testsWithDuration
		.sort((a, b) => (b.test.duration || 0) - (a.test.duration || 0))
		.slice(0, 10)
		.filter((x) => (x.test.duration || 0) > 50);

	if (slowest.length > 0) {
		output.push("## Slowest Tests (top 10)\n");
		for (const { suite, test } of slowest) {
			output.push(
				`- ${shortenSuitePath(suite)} — ${test.title} (${Math.round(
					test.duration || 0,
				)}ms)`,
			);
		}
		output.push("");
	}

	if (report.success) {
		output.push("## ✅ All tests passed!");
	}

	writeFileSync(outputPath, output.join("\n"), "utf-8");
	console.log(`\n📊 Formatted unit test results written to: ${outputPath}`);

	if (!report.success) {
		console.log(`\n❌ ${report.numFailedTests} test(s) failed`);
	}
};

const args = process.argv.slice(2);
if (args.length < 2) {
	console.error("Usage: format-unit-test-results.ts <input-json> <output-md>");
	process.exit(1);
}

formatUnitTestResults({ inputPath: args[0], outputPath: args[1] });
