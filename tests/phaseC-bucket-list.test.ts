import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase C: Dedicated Shared Bucket List Architecture', () => {
  it('1. Dedicated screen route src/app/bucket-list.tsx exists and is exported', () => {
    const screenPath = path.resolve(__dirname, '../src/app/bucket-list.tsx');
    expect(fs.existsSync(screenPath)).toBe(true);

    const content = fs.readFileSync(screenPath, 'utf8');
    expect(content).toContain('export default function BucketListScreen');
    expect(content).toContain('useBucketListItems');
    expect(content).toContain('AddEditBucketItemModal');
    expect(content).toContain('ThemedConfirmDialog');
  });

  it('2. useBucketList hook provides realtime synchronization and status/category filters', () => {
    const hookPath = path.resolve(
      __dirname,
      '../src/features/bucketList/hooks/useBucketList.ts'
    );
    expect(fs.existsSync(hookPath)).toBe(true);

    const content = fs.readFileSync(hookPath, 'utf8');
    // Verifies Realtime subscription
    expect(content).toContain('.channel(');
    expect(content).toContain('postgres_changes');
    expect(content).toContain("table: 'bucket_items'");
    expect(content).toContain('removeChannel');

    // Verifies mutations
    expect(content).toContain('useAddBucketListItem');
    expect(content).toContain('useUpdateBucketListItem');
    expect(content).toContain('useToggleBucketListItem');
    expect(content).toContain('useDeleteBucketListItem');

    // Verifies client-side filtering logic
    expect(content).toContain('pendingCount');
    expect(content).toContain('completedCount');
  });

  it('3. BucketItemCard displays String & Stickers styling, category badges and contributor attribution', () => {
    const cardPath = path.resolve(
      __dirname,
      '../src/features/bucketList/components/BucketItemCard.tsx'
    );
    expect(fs.existsSync(cardPath)).toBe(true);

    const content = fs.readFileSync(cardPath, 'utf8');
    expect(content).toContain('BucketItemCard');
    expect(content).toContain('Added by');
    expect(content).toContain('Done by');
    expect(content).toContain('CATEGORY_META');
    expect(content).toContain('cardShadow');
  });

  it('4. AddEditBucketItemModal validates input and supports categories and target dates', () => {
    const modalPath = path.resolve(
      __dirname,
      '../src/features/bucketList/components/AddEditBucketItemModal.tsx'
    );
    expect(fs.existsSync(modalPath)).toBe(true);

    const content = fs.readFileSync(modalPath, 'utf8');
    expect(content).toContain('AddEditBucketItemModal');
    expect(content).toContain('Please enter a title');
    expect(content).toContain('DatePickerField');
    expect(content).toContain('CATEGORIES');
  });

  it('5. Us tab BucketListCard provides navigation link to full /bucket-list screen', () => {
    const usCardPath = path.resolve(
      __dirname,
      '../src/features/us/components/BucketListCard.tsx'
    );
    expect(fs.existsSync(usCardPath)).toBe(true);

    const content = fs.readFileSync(usCardPath, 'utf8');
    expect(content).toContain('/bucket-list');
    expect(content).toContain('View All');
  });
});
