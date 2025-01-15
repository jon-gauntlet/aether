#!/usr/bin/env python3
"""Script to analyze and summarize alerts."""
import argparse
from pathlib import Path
import json
from typing import List, Dict, Any
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta

def load_alerts(alert_dir: Path) -> pd.DataFrame:
    """Load alerts from JSONL files into DataFrame."""
    data = []
    
    for file in alert_dir.glob("alerts_*.jsonl"):
        with open(file) as f:
            for line in f:
                try:
                    alert = json.loads(line)
                    # Convert timestamp to datetime
                    alert["timestamp"] = datetime.fromisoformat(alert["timestamp"])
                    data.append(alert)
                except Exception as e:
                    print(f"Error parsing line: {e}")
                    continue
    
    return pd.DataFrame(data)

def plot_alert_timeline(df: pd.DataFrame, output_dir: Path):
    """Plot alert timeline."""
    plt.figure(figsize=(12, 6))
    
    # Count alerts by severity and timestamp
    severity_counts = df.groupby(
        [pd.Grouper(key="timestamp", freq="1H"), "severity"]
    ).size().unstack(fill_value=0)
    
    # Plot stacked area chart
    severity_counts.plot(
        kind="area",
        stacked=True,
        alpha=0.6
    )
    
    plt.title("Alert Timeline")
    plt.xlabel("Time")
    plt.ylabel("Number of Alerts")
    plt.legend(title="Severity")
    plt.grid(True)
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig(output_dir / "alert_timeline.png")
    plt.close()

def plot_alert_distribution(df: pd.DataFrame, output_dir: Path):
    """Plot alert distribution by rule and severity."""
    plt.figure(figsize=(12, 6))
    
    # Count alerts by rule and severity
    rule_severity = pd.crosstab(df["rule"], df["severity"])
    
    # Plot stacked bar chart
    rule_severity.plot(
        kind="bar",
        stacked=True
    )
    
    plt.title("Alert Distribution by Rule")
    plt.xlabel("Rule")
    plt.ylabel("Number of Alerts")
    plt.legend(title="Severity")
    plt.grid(True)
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig(output_dir / "alert_distribution.png")
    plt.close()

def plot_value_trends(df: pd.DataFrame, output_dir: Path):
    """Plot value trends for each rule."""
    rules = df["rule"].unique()
    
    for rule in rules:
        rule_data = df[df["rule"] == rule]
        
        plt.figure(figsize=(10, 5))
        
        plt.plot(
            rule_data["timestamp"],
            rule_data["value"],
            marker="o",
            linestyle="--",
            alpha=0.7
        )
        
        # Add threshold line
        if len(rule_data) > 0:
            threshold = rule_data["threshold"].iloc[0]
            plt.axhline(
                y=threshold,
                color="r",
                linestyle="--",
                alpha=0.5,
                label="Threshold"
            )
        
        plt.title(f"Value Trend: {rule}")
        plt.xlabel("Time")
        plt.ylabel("Value")
        plt.legend()
        plt.grid(True)
        plt.xticks(rotation=45)
        
        plt.tight_layout()
        plt.savefig(output_dir / f"value_trend_{rule}.png")
        plt.close()

def generate_summary(df: pd.DataFrame, output_dir: Path):
    """Generate alert summary statistics."""
    summary = {
        "total_alerts": len(df),
        "unique_rules": len(df["rule"].unique()),
        "severity_counts": df["severity"].value_counts().to_dict(),
        "rule_stats": {}
    }
    
    # Stats by rule
    for rule in df["rule"].unique():
        rule_data = df[df["rule"] == rule]
        
        summary["rule_stats"][rule] = {
            "count": len(rule_data),
            "severity": rule_data["severity"].iloc[0],
            "avg_value": rule_data["value"].mean(),
            "max_value": rule_data["value"].max(),
            "threshold": rule_data["threshold"].iloc[0],
            "last_triggered": rule_data["timestamp"].max().isoformat()
        }
    
    # Save summary
    with open(output_dir / "alert_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    
    # Generate markdown report
    report = f"""# Alert Analysis Report

## Overview
- Total Alerts: {summary['total_alerts']}
- Unique Rules: {summary['unique_rules']}

## Severity Distribution
{pd.Series(summary['severity_counts']).to_markdown()}

## Rule Statistics
"""
    
    # Add rule details
    for rule, stats in summary["rule_stats"].items():
        report += f"""
### {rule}
- Count: {stats['count']}
- Severity: {stats['severity']}
- Average Value: {stats['avg_value']:.2f}
- Maximum Value: {stats['max_value']:.2f}
- Threshold: {stats['threshold']}
- Last Triggered: {stats['last_triggered']}
"""
    
    with open(output_dir / "alert_report.md", "w") as f:
        f.write(report)

def main():
    parser = argparse.ArgumentParser(description="Analyze alert data")
    parser.add_argument(
        "--alert-dir",
        type=Path,
        default=Path("alerts"),
        help="Directory containing alert files"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("alert_analysis"),
        help="Directory to save analysis results"
    )
    parser.add_argument(
        "--time-window",
        type=int,
        default=24,
        help="Time window in hours for analysis"
    )
    
    args = parser.parse_args()
    
    # Create output directory
    args.output_dir.mkdir(exist_ok=True)
    
    # Load data
    print("Loading alert data...")
    df = load_alerts(args.alert_dir)
    
    if len(df) == 0:
        print("No alert data found")
        return
    
    # Filter by time window
    cutoff = datetime.now() - timedelta(hours=args.time_window)
    df = df[df["timestamp"] >= cutoff]
    
    print(f"Analyzing {len(df)} alerts...")
    
    # Generate plots
    print("Generating plots...")
    plot_alert_timeline(df, args.output_dir)
    plot_alert_distribution(df, args.output_dir)
    plot_value_trends(df, args.output_dir)
    
    # Generate summary
    print("Generating summary...")
    generate_summary(df, args.output_dir)
    
    print(f"Analysis complete. Results saved to {args.output_dir}")

if __name__ == "__main__":
    main() 