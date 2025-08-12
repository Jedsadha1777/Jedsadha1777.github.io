/**
 * RuleFlow POC - Main Application
 * jQuery-based application initialization
 */

$(document).ready(function() {
    console.log('🚀 RuleFlow POC Starting...');
    
    // Initialize UI components
    RuleFlowUI.init();
    RuleFlowExamples.init();
    
    // Load default example
    setTimeout(() => {
        RuleFlowExamples.loadExample('pricing');
        console.log('✅ Default example loaded');
    }, 100);
    
    // Global error handler
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        RuleFlowUI.debug(`Global error: ${e.error.message}`, 'error');
    });
    
    // Add keyboard shortcuts
    $(document).on('keydown', function(e) {
        // Ctrl+Enter to execute
        if (e.ctrlKey && e.keyCode === 13) {
            e.preventDefault();
            RuleFlowUI.executeRules();
        }
        
        // Ctrl+Shift+G to generate code
        if (e.ctrlKey && e.shiftKey && e.keyCode === 71) {
            e.preventDefault();
            RuleFlowUI.generateCode();
        }
        
        // F12 to toggle debug (if enabled)
        if (e.keyCode === 123 && RuleFlowUI.debugEnabled) {
            e.preventDefault();
            RuleFlowUI.toggleDebug();
        }
    });
    
    // Add development helpers
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Development mode detected');
        
        // Add debug controls to header
        $('.lead').after(`
            <div class="mt-2">
                <small class="text-muted">
                    Dev Mode: 
                    <a href="#" onclick="RuleFlowUI.toggleDebug()">Toggle Debug</a> | 
                    <a href="#" onclick="RuleFlowUI.exportConfig()">Export Config</a> | 
                    <a href="#" onclick="RuleFlowUI.importConfig()">Import Config</a>
                </small>
            </div>
        `);
        
        // Enable debug mode
        RuleFlowUI.debugEnabled = true;
        
        // Add global helpers for console debugging
        window.rf = {
            ui: RuleFlowUI,
            examples: RuleFlowExamples,
            engine: null, // Will be set after first execution
            
            // Quick test function
            test: (configName = 'pricing') => {
                RuleFlowExamples.loadExample(configName);
                setTimeout(() => RuleFlowUI.executeRules(), 100);
            },
            
            // Show function registry
            functions: () => {
                if (RuleFlowUI.ruleFlow) {
                    console.table(RuleFlowUI.ruleFlow.getAvailableFunctions());
                }
            },
            
            // Performance test
            perf: async (iterations = 1000) => {
                const config = RuleFlowUI.getCurrentConfig();
                const inputs = RuleFlowUI.getCurrentInputs();
                
                if (!config) {
                    console.error('No valid configuration');
                    return;
                }
                
                console.log(`Running performance test with ${iterations} iterations...`);
                const start = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    await RuleFlowUI.ruleFlow.evaluate(config, inputs);
                }
                
                const end = performance.now();
                const total = end - start;
                const avg = total / iterations;
                
                console.log(`Performance Results:`);
                console.log(`- Total time: ${total.toFixed(2)}ms`);
                console.log(`- Average per execution: ${avg.toFixed(4)}ms`);
                console.log(`- Executions per second: ${(1000 / avg).toFixed(0)}`);
            }
        };
        
        console.log('🔧 Debug helpers available: window.rf');
        console.log('  - rf.test(example) - Quick test');
        console.log('  - rf.functions() - Show available functions');
        console.log('  - rf.perf(n) - Performance test');
    }
    
    // Show tips in console
    console.log('💡 Tips:');
    console.log('  - Ctrl+Enter: Execute rules');
    console.log('  - Ctrl+Shift+G: Generate code');
    console.log('  - Auto-execution on input change');
    
    console.log('✅ RuleFlow POC Ready!');
});

// Add some utility functions for the demo
window.RuleFlowDemo = {
    /**
     * Show feature comparison
     */
    showFeatures() {
        const features = {
            'Mathematical Expressions': '✅ Full support with precedence',
            'Switch Logic': '✅ AND/OR conditions with nesting',
            'Built-in Functions': '✅ 25+ math, business, and utility functions',
            'Variable References': '✅ $ notation for intermediate calculations', 
            'Code Generation': '✅ Generate optimized JavaScript',
            'Real-time Validation': '✅ Syntax and logic checking',
            'TypeScript Ported': '✅ Core engine from TypeScript',
            'Error Handling': '✅ Comprehensive error reporting',
            'Performance': '✅ Optimized for production use'
        };
        
        console.table(features);
    },
    
    /**
     * Show syntax examples
     */
    showSyntax() {
        const examples = {
            'Simple Formula': 'price * quantity',
            'With Functions': 'round(bmi(weight, height), 2)',
            'Variable Storage': '{ "as": "$subtotal" }',
            'Switch Logic': '{ "switch": "age", "when": [{"if": {"op": "gt", "value": 18}, "result": "adult"}] }',
            'Nested Conditions': '{ "and": [{"field": "age", "op": "gte", "value": 18}, {"field": "income", "op": "gt", "value": 30000}] }'
        };
        
        console.log('🔤 RuleFlow Syntax Examples:');
        Object.entries(examples).forEach(([name, syntax]) => {
            console.log(`  ${name}: ${syntax}`);
        });
    },
    
    /**
     * Performance comparison
     */
    async comparePerformance() {
        console.log('⚡ Performance Comparison:');
        
        // Test with pricing example
        RuleFlowExamples.loadExample('pricing');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const config = RuleFlowUI.getCurrentConfig();
        const inputs = RuleFlowUI.getCurrentInputs();
        
        // Warm up
        for (let i = 0; i < 10; i++) {
            await RuleFlowUI.ruleFlow.evaluate(config, inputs);
        }
        
        // Test RuleFlow engine
        const iterations = 1000;
        const start1 = performance.now();
        for (let i = 0; i < iterations; i++) {
            await RuleFlowUI.ruleFlow.evaluate(config, inputs);
        }
        const end1 = performance.now();
        
        // Test generated code
        const generatedCode = RuleFlowUI.ruleFlow.generateCode(config);
        const generatedFunction = new Function('inputs', generatedCode.split('function generatedRuleFunction(inputs) {')[1].split('return results;')[0] + 'return results;');
        
        const start2 = performance.now();
        for (let i = 0; i < iterations; i++) {
            generatedFunction(inputs);
        }
        const end2 = performance.now();
        
        const engineTime = end1 - start1;
        const generatedTime = end2 - start2;
        const speedup = engineTime / generatedTime;
        
        console.log(`Engine Time: ${engineTime.toFixed(2)}ms (${(engineTime/iterations).toFixed(4)}ms per call)`);
        console.log(`Generated Code Time: ${generatedTime.toFixed(2)}ms (${(generatedTime/iterations).toFixed(4)}ms per call)`);
        console.log(`Speedup: ${speedup.toFixed(1)}x faster with generated code`);
    }
};

// Add demo helpers to global scope in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.demo = window.RuleFlowDemo;
    console.log('🎭 Demo helpers available: window.demo');
    console.log('  - demo.showFeatures() - Show feature list');
    console.log('  - demo.showSyntax() - Show syntax examples');
    console.log('  - demo.comparePerformance() - Performance comparison');
}