// Test script to verify webapp functionality
console.log('🧪 Testing Voice Scam Shield functionality...');

// Test 1: Check if demo scenarios are loaded
setTimeout(() => {
    if (typeof window.VoiceScamShield !== 'undefined') {
        const app = window.VoiceScamShield;
        
        console.log('✅ App loaded successfully');
        console.log('📊 Demo scenarios count:', app.demoScenarios.length);
        console.log('🔧 App settings:', app.settings);
        console.log('🌐 Backend available:', app.backendAvailable);
        
        // Test demo scenario
        if (app.demoScenarios.length > 0) {
            console.log('🎭 Testing first demo scenario...');
            const testScenario = app.demoScenarios[0];
            console.log('📋 Test scenario:', testScenario.title);
            
            // Test the demo
            app.runDemoScenario(testScenario);
        } else {
            console.error('❌ No demo scenarios found!');
        }
    } else {
        console.error('❌ VoiceScamShield app not found!');
    }
}, 2000);

// Test 2: Check DOM elements
setTimeout(() => {
    const demoBtn = document.getElementById('demo-btn');
    const monitorBtn = document.getElementById('monitor-btn');
    const uploadBtn = document.getElementById('upload-btn');
    
    console.log('🔍 DOM Elements:');
    console.log('- Demo button:', demoBtn ? '✅' : '❌');
    console.log('- Monitor button:', monitorBtn ? '✅' : '❌');  
    console.log('- Upload button:', uploadBtn ? '✅' : '❌');
    
    // Test clicking demo button
    if (demoBtn) {
        console.log('🖱️ Simulating demo button click...');
        demoBtn.click();
    }
}, 3000);