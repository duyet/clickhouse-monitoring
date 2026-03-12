/**
 * @fileoverview Agent Chat API E2E tests
 * Tests the AI agent streaming response format and correctness
 */

describe('Agent Chat API E2E Tests', () => {
  const AGENT_API_URL = '/api/v1/agent'

  /**
   * Test: Basic message format validation
   * Sends a simple message and validates the response is streamable
   */
  it('should return valid streaming response for simple message', () => {
    const testMessage = 'hello'

    cy.request({
      url: AGENT_API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        message: testMessage,
        hostId: 0,
      },
      // Don't fail on 4xx/5xx - we want to assert on response
      failOnStatusCode: false,
    }).then((response) => {
      // Response should be successful (or at least not a 400 format error)
      // Note: If LLM is not configured, we might get a 500, but NOT a 400 format error
      expect(response.status).to.not.eq(400)

      // If we get a success response, validate headers
      if (response.status === 200) {
        expect(response.headers).to.have.property('content-type')
        expect(response.headers['content-type']).to.include('text/event-stream')
      }

      // The response body should either be:
      // 1. A stream (empty body in cy.request, but streaming via SSE)
      // 2. An error object with proper structure
      if (response.body && typeof response.body === 'object') {
        // If error, it should have proper error structure
        if (response.body.error) {
          expect(response.body.error).to.have.property('message')
          // Error message should NOT be about "invalid_prompt" format
          expect(response.body.error.message).to.not.include('invalid_prompt')
          expect(response.body.error.message).to.not.include(
            'Invalid Responses API request'
          )
        }
      }
    })
  })

  /**
   * Test: UIMessage format validation
   * Sends message in UIMessage format (with parts array)
   */
  it('should handle UIMessage format with parts array', () => {
    cy.request({
      url: AGENT_API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        messages: [
          {
            id: 'msg-test-1',
            role: 'user',
            parts: [
              {
                type: 'text',
                text: 'hello',
              },
            ],
          },
        ],
        hostId: 0,
      },
      failOnStatusCode: false,
    }).then((response) => {
      // Should not get 400 format error
      expect(response.status).to.not.eq(400)

      // Validate no format-specific errors
      if (response.body?.error) {
        expect(response.body.error.message).to.not.include('invalid_prompt')
        expect(response.body.error.message).to.not.include(
          'expected string, received array'
        )
        expect(response.body.error.message).to.not.include(
          'Invalid Responses API request'
        )
      }
    })
  })

  /**
   * Test: Conversation history format validation
   * Sends multiple messages to test history handling
   */
  it('should handle conversation history correctly', () => {
    cy.request({
      url: AGENT_API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'what is 2+2?' }],
          },
          {
            id: 'msg-2',
            role: 'assistant',
            parts: [{ type: 'text', text: '2+2 equals 4.' }],
          },
          {
            id: 'msg-3',
            role: 'user',
            parts: [{ type: 'text', text: 'and 3+3?' }],
          },
        ],
        hostId: 0,
      },
      failOnStatusCode: false,
    }).then((response) => {
      // Should not get 400 format error
      expect(response.status).to.not.eq(400)

      // Validate no format-specific errors
      if (response.body?.error) {
        expect(response.body.error.message).to.not.include('invalid_prompt')
        expect(response.body.error.message).to.not.include(
          'expected string, received array'
        )
      }
    })
  })

  /**
   * Test: Legacy format (content string) still works
   */
  it('should support legacy message format with content string', () => {
    cy.request({
      url: AGENT_API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        messages: [
          {
            role: 'user',
            content: 'hello',
          },
        ],
        hostId: 0,
      },
      failOnStatusCode: false,
    }).then((response) => {
      // Should not get 400 format error
      expect(response.status).to.not.eq(400)
    })
  })

  /**
   * Test: Error handling for empty message
   */
  it('should return 400 for empty or missing message', () => {
    cy.request({
      url: AGENT_API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        hostId: 0,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body).to.have.property('error')
      expect(response.body.error).to.have.property('message')
      expect(response.body.error.message).to.include('Message is required')
    })
  })

  /**
   * Test: Response format consistency
   * Validates that successful responses have the correct headers
   */
  it('should return correct content-type header for streaming', () => {
    // Only run this test if LLM is configured
    cy.task('checkEnvVar', 'LLM_API_KEY').then((hasApiKey) => {
      if (!hasApiKey) {
        cy.log('Skipping test: LLM_API_KEY not configured')
        return
      }

      cy.request({
        url: AGENT_API_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          message: 'test',
          hostId: 0,
        },
        failOnStatusCode: false,
      }).then((response) => {
        // If successful, should have streaming content type
        if (response.status === 200) {
          expect(response.headers['content-type']).to.match(
            /text\/event-stream|application\/x-ndjson|text\/plain/
          )
        }
      })
    })
  })
})
