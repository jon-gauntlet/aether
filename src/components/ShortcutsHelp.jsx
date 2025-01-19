import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  Grid,
  GridItem,
  useColorModeValue,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShortcutsHelp, formatShortcut, isShortcutAvailable } from '../utils/keyboardShortcuts'

const MotionModalContent = motion(ModalContent)

const ShortcutItem = ({ shortcut, description }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const available = isShortcutAvailable(shortcut)

  return (
    <Grid
      templateColumns="1fr 2fr"
      gap={4}
      p={3}
      bg={bgColor}
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
      opacity={available ? 1 : 0.5}
      _hover={{
        transform: available ? 'translateY(-1px)' : 'none',
        boxShadow: available ? 'sm' : 'none',
      }}
      transition="all 0.2s"
    >
      <GridItem>
        <Text
          fontFamily="mono"
          fontWeight="semibold"
          color={useColorModeValue('blue.600', 'blue.200')}
        >
          {formatShortcut(shortcut)}
        </Text>
      </GridItem>
      <GridItem>
        <Text color={useColorModeValue('gray.700', 'gray.300')}>
          {description}
        </Text>
      </GridItem>
    </Grid>
  )
}

export default function ShortcutsHelp({ isOpen, onClose }) {
  const { shortcuts } = useShortcutsHelp(isOpen, onClose)
  const overlayBg = useColorModeValue(
    'rgba(0, 0, 0, 0.4)',
    'rgba(0, 0, 0, 0.6)'
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          motionPreset="slideInBottom"
          size="lg"
        >
          <ModalOverlay bg={overlayBg} />
          <MotionModalContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ModalHeader
              borderBottomWidth="1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
              Keyboard Shortcuts
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
              >
                {Object.entries(shortcuts).map(([shortcut, description]) => (
                  <motion.div
                    key={shortcut}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="mb-3"
                  >
                    <ShortcutItem
                      shortcut={shortcut}
                      description={description}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </ModalBody>
          </MotionModalContent>
        </Modal>
      )}
    </AnimatePresence>
  )
} 