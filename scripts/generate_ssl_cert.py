#!/usr/bin/env python3
"""Generate SSL certificates for development and testing.


"""
import os
import sys
import ipaddress
import argparse
from pathlib import Path
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from datetime import datetime, timedelta

def generate_ssl_cert(
    output_dir: str,
    common_name: str = "localhost",
    country: str = "US",
    state: str = "CA",
    locality: str = "San Francisco",
    org: str = "Aether",
    org_unit: str = "Development",
    days_valid: int = 365
):
    """Generate SSL certificate and private key.
    
    Args:
        output_dir: Directory to save certificate and key
        common_name: Common name for certificate
        country: Country code
        state: State or province
        locality: City or locality
        org: Organization name
        org_unit: Organizational unit
        days_valid: Number of days certificate is valid
    """
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Generate key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    
    # Generate certificate
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        x509.NameAttribute(NameOID.COUNTRY_NAME, country),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, state),
        x509.NameAttribute(NameOID.LOCALITY_NAME, locality),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, org),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, org_unit),
    ])
    
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.utcnow()
    ).not_valid_after(
        datetime.utcnow() + timedelta(days=days_valid)
    ).add_extension(
        x509.SubjectAlternativeName([
            x509.DNSName(common_name),
            x509.DNSName("localhost"),
            x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
        ]),
        critical=False,
    ).sign(private_key, hashes.SHA256())
    
    # Write certificate
    cert_path = output_path / "cert.pem"
    with open(cert_path, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
    
    # Write private key
    key_path = output_path / "key.pem"
    with open(key_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))
    
    print(f"Generated SSL certificate and key in {output_path}")
    print(f"Certificate: {cert_path}")
    print(f"Private key: {key_path}")

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Generate SSL certificate for development"
    )
    parser.add_argument(
        "--output-dir",
        default="config/ssl",
        help="Output directory for certificate and key"
    )
    parser.add_argument(
        "--common-name",
        default="localhost",
        help="Common name for certificate"
    )
    parser.add_argument(
        "--country",
        default="US",
        help="Country code"
    )
    parser.add_argument(
        "--state",
        default="CA",
        help="State or province"
    )
    parser.add_argument(
        "--locality",
        default="San Francisco",
        help="City or locality"
    )
    parser.add_argument(
        "--org",
        default="Aether",
        help="Organization name"
    )
    parser.add_argument(
        "--org-unit",
        default="Development",
        help="Organizational unit"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=365,
        help="Number of days certificate is valid"
    )
    
    args = parser.parse_args()
    
    generate_ssl_cert(
        output_dir=args.output_dir,
        common_name=args.common_name,
        country=args.country,
        state=args.state,
        locality=args.locality,
        org=args.org,
        org_unit=args.org_unit,
        days_valid=args.days
    )

if __name__ == "__main__":
    main() 