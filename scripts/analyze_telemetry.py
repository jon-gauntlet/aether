#!/usr/bin/env python3
"""Script to analyze and visualize telemetry data."""
import argparse
from pathlib import Path
import json
from typing import List, Dict, Any
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta

def load_telemetry_data(telemetry_dir: Path) -> pd.DataFrame:
    """Load telemetry data from JSONL files into DataFrame."""
    data = []
    
    for file in telemetry_dir.glob("telemetry_*.jsonl"):
        with open(file) as f:
            for line in f:
                try:
                    point = json.loads(line)
                    # Flatten metrics into columns
                    flat_point = {
                        "timestamp": datetime.fromisoformat(point["timestamp"]),
                        "operation": point["operation"],
                        "component": point["component"]
                    }
                    # Add metrics as columns
                    flat_point.update(point["metrics"])
                    # Add labels as columns with label_ prefix
                    flat_point.update({
                        f"label_{k}": v
                        for k, v in point["labels"].items()
                    })
                    data.append(flat_point)
                except Exception as e:
                    print(f"Error parsing line: {e}")
                    continue
    
    return pd.DataFrame(data)

def plot_operation_durations(df: pd.DataFrame, output_dir: Path):
    """Plot operation durations over time."""
    plt.figure(figsize=(12, 6))
    
    operations = df["operation"].unique()
    for op in operations:
        op_data = df[df["operation"] == op]
        if "duration_ms" in op_data.columns:
            plt.plot(
                op_data["timestamp"],
                op_data["duration_ms"],
                label=op,
                marker="o",
                linestyle="--",
                alpha=0.7
            )
    
    plt.title("Operation Durations Over Time")
    plt.xlabel("Timestamp")
    plt.ylabel("Duration (ms)")
    plt.legend()
    plt.grid(True)
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig(output_dir / "operation_durations.png")
    plt.close()

def plot_component_metrics(df: pd.DataFrame, output_dir: Path):
    """Plot component-specific metrics."""
    components = df["component"].unique()
    
    for component in components:
        comp_data = df[df["component"] == component]
        metrics = [col for col in comp_data.columns if col not in ["timestamp", "operation", "component"]]
        
        for metric in metrics:
            if pd.api.types.is_numeric_dtype(comp_data[metric]):
                plt.figure(figsize=(10, 5))
                
                sns.boxplot(data=comp_data, x="operation", y=metric)
                plt.title(f"{component} - {metric}")
                plt.xticks(rotation=45)
                
                plt.tight_layout()
                plt.savefig(output_dir / f"{component}_{metric}_boxplot.png")
                plt.close()

def plot_success_rates(df: pd.DataFrame, output_dir: Path):
    """Plot operation success rates."""
    if "success" in df.columns:
        success_rates = df.groupby("operation")["success"].agg(["count", "sum"])
        success_rates["rate"] = success_rates["sum"] / success_rates["count"] * 100
        
        plt.figure(figsize=(10, 5))
        success_rates["rate"].plot(kind="bar")
        plt.title("Operation Success Rates")
        plt.xlabel("Operation")
        plt.ylabel("Success Rate (%)")
        plt.xticks(rotation=45)
        
        plt.tight_layout()
        plt.savefig(output_dir / "success_rates.png")
        plt.close()

def generate_summary_stats(df: pd.DataFrame, output_dir: Path):
    """Generate summary statistics."""
    summary = {
        "operations": {},
        "components": {}
    }
    
    # Operation stats
    for op in df["operation"].unique():
        op_data = df[df["operation"] == op]
        op_stats = {
            "count": len(op_data),
            "success_rate": op_data["success"].mean() * 100 if "success" in op_data else None,
            "avg_duration": op_data["duration_ms"].mean() if "duration_ms" in op_data else None,
            "p95_duration": op_data["duration_ms"].quantile(0.95) if "duration_ms" in op_data else None
        }
        summary["operations"][op] = op_stats
    
    # Component stats
    for comp in df["component"].unique():
        comp_data = df[df["component"] == comp]
        metrics = [
            col for col in comp_data.columns
            if pd.api.types.is_numeric_dtype(comp_data[col])
            and col not in ["timestamp"]
        ]
        
        comp_stats = {
            metric: {
                "mean": comp_data[metric].mean(),
                "std": comp_data[metric].std(),
                "min": comp_data[metric].min(),
                "max": comp_data[metric].max()
            }
            for metric in metrics
        }
        summary["components"][comp] = comp_stats
    
    # Save summary
    with open(output_dir / "summary_stats.json", "w") as f:
        json.dump(summary, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description="Analyze telemetry data")
    parser.add_argument(
        "--telemetry-dir",
        type=Path,
        default=Path("telemetry"),
        help="Directory containing telemetry files"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("telemetry_analysis"),
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
    print("Loading telemetry data...")
    df = load_telemetry_data(args.telemetry_dir)
    
    if len(df) == 0:
        print("No telemetry data found")
        return
    
    # Filter by time window
    cutoff = datetime.now() - timedelta(hours=args.time_window)
    df = df[df["timestamp"] >= cutoff]
    
    print(f"Analyzing {len(df)} telemetry points...")
    
    # Generate plots
    print("Generating plots...")
    plot_operation_durations(df, args.output_dir)
    plot_component_metrics(df, args.output_dir)
    plot_success_rates(df, args.output_dir)
    
    # Generate summary stats
    print("Generating summary statistics...")
    generate_summary_stats(df, args.output_dir)
    
    print(f"Analysis complete. Results saved to {args.output_dir}")

if __name__ == "__main__":
    main() 