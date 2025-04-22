import fetch from 'node-fetch';

async function testMCP() {
  console.log('Testing MCP server with JSON-RPC 2.0 format...');
  
  // Test list_tabs
  console.log('\nTesting list_tabs method:');
  const listTabsResponse = await fetch('http://localhost:7742/invoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '123',
      method: 'list_tabs',
      params: {}
    }),
  });
  
  const listTabsResult = await listTabsResponse.json();
  console.log(JSON.stringify(listTabsResult, null, 2));
  
  // If list_tabs was successful, test start_session with first tab
  if (listTabsResult.result && 
      listTabsResult.result.success && 
      listTabsResult.result.data.tabs.length > 0) {
    
    console.log('\nTesting start_session method:');
    const startSessionResponse = await fetch('http://localhost:7742/invoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '456',
        method: 'start_session',
        params: {
          tabIndex: 0
        }
      }),
    });
    
    const startSessionResult = await startSessionResponse.json();
    console.log(JSON.stringify(startSessionResult, null, 2));
  }
}

testMCP().catch(console.error); 