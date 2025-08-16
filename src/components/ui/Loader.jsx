import React from 'react'

const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "#131515"}}>
      <div className="relative">
        <div className="absolute transform rotate-90" style={{left: '40%', top: '50%'}}>
          <div className="loader-square">
            <div className="loader-square">
              <div className="loader-square">
                <div className="loader-square">
                  <div className="loader-square">
                    <div className="loader-square"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute transform -rotate-90" style={{left: '40%', top: '50%'}}>
          <div className="loader-square">
            <div className="loader-square">
              <div className="loader-square">
                <div className="loader-square">
                  <div className="loader-square">
                    <div className="loader-square"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute" style={{left: '40%', top: '50%'}}>
          <div className="loader-square">
            <div className="loader-square">
              <div className="loader-square">
                <div className="loader-square">
                  <div className="loader-square">
                    <div className="loader-square"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute transform rotate-180" style={{left: '40%', top: '50%'}}>
          <div className="loader-square">
            <div className="loader-square">
              <div className="loader-square">
                <div className="loader-square">
                  <div className="loader-square">
                    <div className="loader-square"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .loader-square {
          width: 8px;
          height: 30px;
          background: rgb(71, 195, 248);
          border-radius: 10px;
          display: block;
          animation: turn 2.5s ease infinite;
          box-shadow: rgb(71, 195, 248) 0px 1px 15px 0px;
        }

        @keyframes turn {
          0% {
            transform: translateX(0) translateY(0) rotate(0);
          }
          70% {
            transform: translateX(400%) translateY(100%) rotate(90deg);
          }
          100% {
            transform: translateX(0) translateY(0) rotate(0);
          }
        }
      `}</style>
    </div>
  )
}

export default Loader