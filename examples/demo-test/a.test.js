// ❌ 错误: 独立的 expect
expect(foo).toBe(true);

// ✅ 正确: expect 在测试块内
test('my test', () => {
    expect(foo).toBe(true);
});

// ✅ 正确: expect 在 describe 块内的测试中
describe('my suite', () => {
    it('my test', () => {
        expect(foo).toBe(true);
    });
});