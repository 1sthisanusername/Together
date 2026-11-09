import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase A: Camera Tab & Shared Home Page Photo', () => {
  it('Bottom navigation replaces Dates with Camera', () => {
    const layoutPath = path.resolve(__dirname, '../src/app/(tabs)/_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');

    expect(content).toContain('name="camera"');
    expect(content).toContain('CameraIcon');
  });

  it('Camera screen provides photo capture and gallery picker', () => {
    const cameraPath = path.resolve(__dirname, '../src/app/(tabs)/camera.tsx');
    const content = fs.readFileSync(cameraPath, 'utf8');

    expect(content).toContain('launchCameraAsync');
    expect(content).toContain('launchImageLibraryAsync');
    expect(content).toContain('Set as Home Cover Photo');
  });

  it('HomePagePhotoCard is rendered on the home screen', () => {
    const homePath = path.resolve(__dirname, '../src/app/(tabs)/home.tsx');
    const content = fs.readFileSync(homePath, 'utf8');

    expect(content).toContain('HomePagePhotoCard');
  });

  it('Migration file adds home_photo columns to couples table', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../supabase/migrations/20261110000013_home_page_photo.sql'
    );
    const content = fs.readFileSync(migrationPath, 'utf8');

    expect(content).toContain('home_photo_url');
    expect(content).toContain('home_photo_updated_at');
    expect(content).toContain('home_photo_updated_by');
  });
});

