import { db } from '@/core/firebase'
import { doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore'


/**
 * @typedef {Object} DeploymentProtection
 * @property {boolean} flowGuard
 * @property {boolean} patternShield
 * @property {boolean} energyBarrier
 */

/**
 * @typedef {Object} DeploymentState
 * @property {import('firebase/firestore').Timestamp|null} lastDeployment
 * @property {'stable'|'deploying'|'error'} status
 * @property {number} energyLevel
 * @property {number} coherenceLevel
 * @property {DeploymentProtection} protection
 */

/**
 * @typedef {Object} DeployContextType
 * @property {DeploymentState} deploymentState
 * @property {function(Partial<DeploymentProtection>): Promise<void>} updateProtection
 * @property {boolean} canDeploy
 * @property {boolean} isProtected
 */

/** @type {DeploymentState} */
const initialState = {
  lastDeployment: null,
  status: 'stable',
  energyLevel: 1,
  coherenceLevel: 1,
  protection: {
    flowGuard: true,
    patternShield: true,
    energyBarrier: true
  }
}

/** @type {React.Context<DeployContextType|undefined>} */
const DeployContext = createContext(undefined)

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const DeployGuard = ({ children }) => {
  /** @type {[DeploymentState, function(DeploymentState): void]} */
  const [deploymentState, setDeploymentState] = useState(initialState)
  const { user, consciousnessState } = useAuth()

  const isProtected = React.useMemo(() => {
    return deploymentState.protection.flowGuard && 
           deploymentState.protection.patternShield &&
           deploymentState.protection.energyBarrier &&
           deploymentState.energyLevel >= 0.8 &&
           deploymentState.coherenceLevel >= 0.8
  }, [deploymentState])

  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshot(doc(db, 'deployments', 'status'), (doc) => {
      if (doc.exists()) {
        /** @type {DeploymentState} */
        const data = doc.data()
        setDeploymentState(data)
      }
    })

    return () => unsubscribe()
  }, [user])

  /**
   * @param {Partial<DeploymentProtection>} protection
   * @returns {Promise<void>}
   */
  const updateProtection = async (protection) => {
    if (!user) return

    const newState = {
      ...deploymentState,
      protection: {
        ...deploymentState.protection,
        ...protection
      }
    }

    await setDoc(doc(db, 'deployments', 'status'), newState)
  }

  const canDeploy = isProtected && deploymentState.status === 'stable'

  return (
    <DeployContext.Provider value={{ 
      deploymentState,
      updateProtection,
      canDeploy,
      isProtected
    }}>
      {children}
    </DeployContext.Provider>
  )
}

/**
 * @returns {DeployContextType}
 */
export const useDeployment = () => {
  const context = useContext(DeployContext)
  if (!context) {
    throw new Error('useDeployment must be used within DeployGuard')
  }
  return context
} 