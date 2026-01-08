/**
 * Enum for PGP operation modes
 * Defines the available modes for PGP operations in the application
 */
export enum PGPMode {
	ENCRYPT = 'encrypt',
	DECRYPT = 'decrypt'
}

/**
 * Type alias for backward compatibility and convenience
 * Can be used where the enum values are needed as a union type
 */
export type PGPModeType = `${PGPMode}`;
