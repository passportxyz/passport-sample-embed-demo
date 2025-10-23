import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { PassportScoreWidget, usePassportScore, DarkTheme, LightTheme } from '@human.tech/passport-embed'

export default function Home() {
  const { address, isConnected } = useAccount()
  const [verifiedScore, setVerifiedScore] = useState<{ score: number; isPassing: boolean } | null>(null)
  
  // Use the usePassportScore hook for initial client-side check
  const { data: passportData, isError: passportError, error } = usePassportScore({
    apiKey: process.env.NEXT_PUBLIC_PASSPORT_API_KEY!,
    scorerId: process.env.NEXT_PUBLIC_PASSPORT_SCORER_ID!,
    address: address,
  })

  // Signature callback for OAuth-based Stamps
  const signMessage = async (message: string): Promise<string> => {
    if (!window.ethereum) throw new Error('No wallet found')
    
    const accounts = await (window.ethereum as any).request({ 
      method: 'eth_requestAccounts' 
    }) as string[]
    
    return await (window.ethereum as any).request({
      method: 'personal_sign',
      params: [message, accounts[0]]
    }) as string
  }
  
  // Trigger server-side verification when client-side hook shows passing score
  useEffect(() => {
    if (address && isConnected && passportData?.passingScore && !verifiedScore) {
      console.log('🔍 Client-side shows passing score, starting server-side verification for address:', address)
      console.log('📊 Client-side data:', { score: passportData.score, passing: passportData.passingScore })
      
      fetch('/api/verify-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      })
        .then(res => res.json())
        .then(data => {
          console.log('📊 Server-side verification response:', data)
          if (data.verified) {
            const numericScore = parseFloat(data.score)
            setVerifiedScore({
              score: numericScore,
              isPassing: numericScore >= 20
            })
            console.log('✅ Server-side score verified:', { score: numericScore, isPassing: numericScore >= 20 })
          } else {
            console.log('❌ Server-side score verification failed:', data)
            setVerifiedScore(null)
          }
        })
        .catch(err => {
          console.error('🚨 Server-side score verification error:', err)
          setVerifiedScore(null)
        })
    } else if (!address || !isConnected) {
      console.log('⏸️ No address or not connected - clearing verified score')
      setVerifiedScore(null)
    }
  }, [address, isConnected, passportData?.passingScore, verifiedScore])

  if (!isConnected) {
    return (
      <div className="container">
        <div className="fixed-wallet-button">
          <w3m-button />
        </div>
        <div className="header-section">
          <div className="passport-logo">
            <img 
              src="https://app.passport.xyz/assets/scoreLogoLoading.svg" 
              alt="Passport Logo"
              className="passport-logo-svg"
            />
          </div>
          <h1 className="title">Passport Embed Demo</h1>
          <p className="subtitle">Connect your wallet to check your Passport score</p>
        </div>
        <div className="main-content">
          <div className="card connect-card">
            <h3>Ready to get started?</h3>
            <p>Connect your Ethereum wallet to view your Unique Humanity Score.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="fixed-wallet-button">
        <w3m-button />
      </div>
      <div className="header-section">
        <div className="passport-logo">
          <img 
            src="https://app.passport.xyz/assets/scoreLogoLoading.svg" 
            alt="Passport Logo"
            className="passport-logo-svg"
          />
        </div>
        <h1 className="title">Passport Embed Demo</h1>
        <p className="subtitle">Build your Unique Humanity Score to unlock exclusive access</p>
        <div className="header-buttons">
          <a 
            href="https://tally.so/r/3X81KL" 
            target="_blank" 
            rel="noopener noreferrer"
            className="header-button primary"
          >
            Partner with us
          </a>
          <a 
            href="https://docs.passport.xyz/building-with-passport/stamps/passport-embed/introduction" 
            target="_blank" 
            rel="noopener noreferrer"
            className="header-button secondary"
          >
            Docs
          </a>
        </div>
      </div>
      <div className="main-content">
        <div className="explanation-column">
          <h2 className="explanation-title">How Passport Embed Works</h2>
          <div className="explanation-section">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Connect Your Wallet</h3>
              <p>Users start by connecting their Ethereum wallet. If the wallet is already connected on your site, the widget will pull in the wallet context and skip this step.</p>
            </div>
          </div>
          <div className="explanation-section">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Automatic Web3 Stamps</h3>
              <p>As soon as Embed loads with the wallet context, it will automatically verify any web3 Stamps that the user qualifies for.</p>
            </div>
          </div>
          <div className="explanation-section">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Build Up Your Score</h3>
              <p>If the user&apos;s score is still below the threshold, the widget will walk users through pages of different Stamps that they can verify to build up their score.</p>
            </div>
          </div>
          <div className="explanation-section">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Unlock Access</h3>
              <p>Once your score meets your defined threshold (20+ recommended), they&apos;ll be granted access to the protected program.</p>
            </div>
          </div>
          <div className="explanation-note">
            <h4>Important Considerations</h4>
            <ul>
              <li>Passport Embed is free for partners to use</li>
              <li>Integration can take as little as 5 minutes, with just a few lines of code</li>
              <li>Future updates will add &apos;minting onchain&apos; and further customizations to enable partners to brand the component, as well as update the Stamp line up.</li>
            </ul>
          </div>
        </div>
        <div className="widget-column">
          <div className="card">
            <div className="wallet-address">
              Connected: {address?.slice(0, 8)}...{address?.slice(-6)}
            </div>
            <div className="passport-widget-container">
              <PassportScoreWidget
                apiKey={process.env.NEXT_PUBLIC_PASSPORT_API_KEY!}
                scorerId={process.env.NEXT_PUBLIC_PASSPORT_SCORER_ID!}
                address={address}
                generateSignatureCallback={signMessage}
                theme={DarkTheme}
              />
            </div>
          </div>
          
          
          {/* Score status indicators */}
          {passportData && (
            <div className="score-status-card">
              <h3>Score Status</h3>
              <div className="explanation-note">
                <h4>Security First</h4>
                <p>Your score should be verified both client-side for display and server-side using Passport&apos;s Stamps API to prevent tampering.</p>
              </div>
              <div className="status-row">
                <span className="status-label">Client-side Score:</span>
                <span className={`status-value ${passportData.passingScore ? 'passing' : 'failing'}`}>
                  {passportData.score?.toFixed(2) || 'Loading...'}
                  {passportData.passingScore ? ' ✅' : ' ❌'}
                </span>
              </div>
              {passportData.passingScore && (
                <div className="status-row">
                  <span className="status-label">Server-side Verification:</span>
                  <span className={`status-value ${verifiedScore ? 'verified' : 'pending'}`}>
                    {verifiedScore ? `${verifiedScore.score.toFixed(2)} ✅ Verified` : '⏳ Verifying...'}
                  </span>
                </div>
              )}
              {passportError && (
                <div className="status-row error">
                  <span className="status-label">Error:</span>
                  <span className="status-value">{(error as Error)?.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Access panel - always shown */}
          <div className={verifiedScore && verifiedScore.isPassing ? "unlock-section" : "locked-section"}>
            {verifiedScore && verifiedScore.isPassing ? (
              // Unlocked state
              <>
                <h2 className="unlock-title">🎉 Access Unlocked!</h2>
                <p className="unlock-description">
                  Congratulations! Your Unique Humanity Score of {verifiedScore.score.toFixed(2)} meets our threshold. 
                  You now have access to exclusive features.
                </p>
                <div className="community-links">
                  <a 
                    href="https://discord.com/invite/zfGqjA5pxU" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="unlock-button"
                  >
                    Join User Community Discord 💬
                  </a>
                </div>
              </>
            ) : (
              // Locked state  
              <>
                <h2 className="locked-title">🔒 Access Locked</h2>
                <p className="locked-description">
                  {passportData?.passingScore && !verifiedScore 
                    ? `Client-side score of ${passportData.score?.toFixed(2)} looks good! Verifying server-side...`
                    : verifiedScore 
                      ? `Your current score of ${verifiedScore.score.toFixed(2)} is below our threshold. Build your score to 20 or higher to unlock exclusive access.`
                      : "Build your Unique Humanity Score to 20 or higher to unlock access to exclusive features."
                  }
                </p>
                <div className="locked-button">
                  Minimum Score Required: 20.00
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

