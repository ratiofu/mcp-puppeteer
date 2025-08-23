/**
 * Coverage Analysis Helper
 * Parses coverage-final.json and provides actionable insights
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const COVERAGE_FILE = 'coverage/coverage-final.json';
const THRESHOLDS = {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
};

function analyzeCoverage() {
    if (!existsSync(COVERAGE_FILE)) {
        console.log('❌ No coverage report found. Run tests with coverage first: pnpm run test:coverage');
        process.exit(1);
    }

    try {
        const coverageData = JSON.parse(readFileSync(COVERAGE_FILE, 'utf8'));

        console.log('📊 Test Coverage Analysis\n');

        // Overall summary
        let totalLines = 0, coveredLines = 0;
        let totalFunctions = 0, coveredFunctions = 0;
        let totalBranches = 0, coveredBranches = 0;
        let totalStatements = 0, coveredStatements = 0;

        const fileResults = [];

        for (const [filePath, fileData] of Object.entries(coverageData)) {
            // Skip non-source files
            if (!filePath.includes('/src/') || filePath.includes('test') || filePath.includes('spec')) {
                continue;
            }

            const lines = fileData.s ? Object.values(fileData.s) : [];
            const functions = fileData.f ? Object.values(fileData.f) : [];
            const branches = fileData.b ? Object.values(fileData.b).flat() : [];
            const statements = fileData.s ? Object.values(fileData.s) : [];

            const fileCoveredLines = lines.filter(count => count > 0).length;
            const fileCoveredFunctions = functions.filter(count => count > 0).length;
            const fileCoveredBranches = branches.filter(count => count > 0).length;
            const fileCoveredStatements = statements.filter(count => count > 0).length;

            totalLines += lines.length;
            coveredLines += fileCoveredLines;
            totalFunctions += functions.length;
            coveredFunctions += fileCoveredFunctions;
            totalBranches += branches.length;
            coveredBranches += fileCoveredBranches;
            totalStatements += statements.length;
            coveredStatements += fileCoveredStatements;

            const linesPct = lines.length > 0 ? (fileCoveredLines / lines.length * 100) : 100;
            const functionsPct = functions.length > 0 ? (fileCoveredFunctions / functions.length * 100) : 100;
            const branchesPct = branches.length > 0 ? (fileCoveredBranches / branches.length * 100) : 100;
            const statementsPct = statements.length > 0 ? (fileCoveredStatements / statements.length * 100) : 100;

            fileResults.push({
                file: filePath.replace(process.cwd() + '/', ''),
                lines: { covered: fileCoveredLines, total: lines.length, pct: linesPct },
                functions: { covered: fileCoveredFunctions, total: functions.length, pct: functionsPct },
                branches: { covered: fileCoveredBranches, total: branches.length, pct: branchesPct },
                statements: { covered: fileCoveredStatements, total: statements.length, pct: statementsPct },
                uncoveredLines: getUncoveredLines(fileData)
            });
        }

        // Overall percentages
        const overallLines = totalLines > 0 ? (coveredLines / totalLines * 100) : 100;
        const overallFunctions = totalFunctions > 0 ? (coveredFunctions / totalFunctions * 100) : 100;
        const overallBranches = totalBranches > 0 ? (coveredBranches / totalBranches * 100) : 100;
        const overallStatements = totalStatements > 0 ? (coveredStatements / totalStatements * 100) : 100;

        // Display overall results
        console.log('🎯 Overall Coverage:');
        console.log(`Lines:      ${overallLines.toFixed(1)}% (${coveredLines}/${totalLines}) ${getStatusIcon(overallLines, THRESHOLDS.lines)}`);
        console.log(`Functions:  ${overallFunctions.toFixed(1)}% (${coveredFunctions}/${totalFunctions}) ${getStatusIcon(overallFunctions, THRESHOLDS.functions)}`);
        console.log(`Branches:   ${overallBranches.toFixed(1)}% (${coveredBranches}/${totalBranches}) ${getStatusIcon(overallBranches, THRESHOLDS.branches)}`);
        console.log(`Statements: ${overallStatements.toFixed(1)}% (${coveredStatements}/${totalStatements}) ${getStatusIcon(overallStatements, THRESHOLDS.statements)}`);
        console.log();

        // Files needing attention
        const needsAttention = fileResults.filter(file =>
            file.lines.pct < THRESHOLDS.lines ||
            file.functions.pct < THRESHOLDS.functions ||
            file.branches.pct < THRESHOLDS.branches ||
            file.statements.pct < THRESHOLDS.statements
        );

        if (needsAttention.length > 0) {
            console.log('⚠️  Files Below Threshold:');
            needsAttention.forEach(file => {
                console.log(`\n📁 ${file.file}`);
                if (file.lines.pct < THRESHOLDS.lines) {
                    console.log(`  Lines: ${file.lines.pct.toFixed(1)}% (${file.lines.covered}/${file.lines.total}) - Need ${Math.ceil((THRESHOLDS.lines / 100 * file.lines.total) - file.lines.covered)} more`);
                }
                if (file.functions.pct < THRESHOLDS.functions) {
                    console.log(`  Functions: ${file.functions.pct.toFixed(1)}% (${file.functions.covered}/${file.functions.total}) - Need ${Math.ceil((THRESHOLDS.functions / 100 * file.functions.total) - file.functions.covered)} more`);
                }
                if (file.branches.pct < THRESHOLDS.branches) {
                    console.log(`  Branches: ${file.branches.pct.toFixed(1)}% (${file.branches.covered}/${file.branches.total}) - Need ${Math.ceil((THRESHOLDS.branches / 100 * file.branches.total) - file.branches.covered)} more`);
                }
                if (file.uncoveredLines.length > 0) {
                    console.log(`  Uncovered lines: ${file.uncoveredLines.slice(0, 10).join(', ')}${file.uncoveredLines.length > 10 ? '...' : ''}`);
                }
            });
        } else {
            console.log('✅ All files meet coverage thresholds!');
        }

        // Exit with appropriate code
        const allThresholdsMet = overallLines >= THRESHOLDS.lines &&
            overallFunctions >= THRESHOLDS.functions &&
            overallBranches >= THRESHOLDS.branches &&
            overallStatements >= THRESHOLDS.statements;

        process.exit(allThresholdsMet ? 0 : 1);

    } catch (error) {
        console.error('❌ Error analyzing coverage:', error.message);
        process.exit(1);
    }
}

function getStatusIcon(percentage, threshold) {
    return percentage >= threshold ? '✅' : '❌';
}

function getUncoveredLines(fileData) {
    if (!fileData.statementMap || !fileData.s) return [];

    const uncovered = [];
    for (const [statementId, count] of Object.entries(fileData.s)) {
        if (count === 0 && fileData.statementMap[statementId]) {
            uncovered.push(fileData.statementMap[statementId].start.line);
        }
    }

    return [...new Set(uncovered)].sort((a, b) => a - b);
}

// Run the analysis
analyzeCoverage();