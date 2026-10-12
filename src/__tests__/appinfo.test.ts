import info from '../../app-info.json';

// tomori-app-lab (一覧サイト) の validateApps と同じ条件で確認する
describe('app-info.json', () => {
  test('一覧サイトの登録条件を満たす', () => {
    expect(info.id).toBe('007');
    expect(info.id).toMatch(/^\d{3}$/);
    expect(info.usageSteps.length).toBeGreaterThanOrEqual(3);
    expect(info.usageSteps.length).toBeLessThanOrEqual(5);
    expect(info.appUrl).toBe('https://tomoricot-alt.github.io/tomori-math-007/');
    expect(info.features.length).toBeGreaterThan(0);
    expect(info.notes.length).toBeGreaterThan(0);
    expect(['published', 'beta', 'coming-soon']).toContain(info.status);
    expect(info.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
