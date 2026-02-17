#!/usr/bin/env tsx

/**
 * Data migration script to regenerate slugs for existing index entries.
 * This updates all entries to use hierarchical slugs (e.g., "dog_fur" instead of just "fur").
 *
 * Usage:
 *   tsx scripts/migrate-slugs.ts [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be changed without making any updates
 */

import { eq, isNull } from "drizzle-orm";
import { db } from "../src/db/client";
import { indexEntries } from "../src/db/schema";
import { generateSlug } from "../src/modules/index-entry/slug-utils";

type IndexEntryRow = {
	id: string;
	label: string;
	slug: string;
	parentId: string | null;
};

const isDryRun = process.argv.includes("--dry-run");

const getEntryById = async (
	id: string,
): Promise<{ label: string; parentId: string | null } | null> => {
	const result = await db
		.select({
			label: indexEntries.label,
			parentId: indexEntries.parentId,
		})
		.from(indexEntries)
		.where(eq(indexEntries.id, id))
		.limit(1);

	return result[0] || null;
};

const migrateEntrySlugs = async () => {
	console.log(
		isDryRun
			? "🔍 DRY RUN MODE - No changes will be made\n"
			: "🚀 Starting slug migration\n",
	);

	// Get all non-deleted entries
	const entries = await db
		.select({
			id: indexEntries.id,
			label: indexEntries.label,
			slug: indexEntries.slug,
			parentId: indexEntries.parentId,
		})
		.from(indexEntries)
		.where(isNull(indexEntries.deletedAt));

	console.log(`Found ${entries.length} entries to process\n`);

	let updatedCount = 0;
	let unchangedCount = 0;
	const conflicts: Array<{
		entry: IndexEntryRow;
		oldSlug: string;
		newSlug: string;
	}> = [];

	for (const entry of entries) {
		const newSlug = await generateSlug({
			label: entry.label,
			parentId: entry.parentId,
			getEntryById,
		});

		if (newSlug === entry.slug) {
			unchangedCount++;
			continue;
		}

		console.log(`📝 Entry "${entry.label}" (${entry.id})`);
		console.log(`   Old slug: ${entry.slug}`);
		console.log(`   New slug: ${newSlug}`);

		// Check if new slug already exists for a different entry in the same project
		const existingEntry = await db
			.select({ id: indexEntries.id })
			.from(indexEntries)
			.where(eq(indexEntries.slug, newSlug))
			.limit(1);

		if (existingEntry.length > 0 && existingEntry[0].id !== entry.id) {
			console.log(
				`   ⚠️  WARNING: Slug conflict detected with entry ${existingEntry[0].id}`,
			);
			conflicts.push({ entry, oldSlug: entry.slug, newSlug });
			continue;
		}

		if (!isDryRun) {
			await db
				.update(indexEntries)
				.set({ slug: newSlug })
				.where(eq(indexEntries.id, entry.id));
			console.log(`   ✅ Updated\n`);
		} else {
			console.log(`   (would update)\n`);
		}

		updatedCount++;
	}

	console.log(`\n${"=".repeat(60)}`);
	console.log(`📊 Migration Summary:`);
	console.log(`   Total entries: ${entries.length}`);
	console.log(`   Updated: ${updatedCount}`);
	console.log(`   Unchanged: ${unchangedCount}`);
	console.log(`   Conflicts: ${conflicts.length}`);

	if (conflicts.length > 0) {
		console.log("\n⚠️  CONFLICTS DETECTED:");
		for (const conflict of conflicts) {
			console.log(
				`   - Entry "${conflict.entry.label}" (${conflict.entry.id})`,
			);
			console.log(`     ${conflict.oldSlug} → ${conflict.newSlug}`);
		}
		console.log(
			"\nPlease resolve conflicts manually before running migration.",
		);
		process.exit(1);
	}

	if (isDryRun) {
		console.log(
			"\n✅ Dry run complete. Run without --dry-run to apply changes.",
		);
	} else {
		console.log("\n✅ Migration complete!");
	}
};

// Run migration
migrateEntrySlugs()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	});
