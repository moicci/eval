#!/usr/bin/env python3
"""
T-shirt background removal CLI tool
Removes background from T-shirt images and makes it white
"""

import argparse
import os
import sys
from pathlib import Path
from PIL import Image
import numpy as np

try:
    from rembg import remove, new_session
except ImportError:
    print("rembg library not found. Please install it with: pip install rembg")
    sys.exit(1)


def remove_background(input_path: str, output_path: str = None, white_background: bool = True, model: str = "u2net"):
    """
    Remove background from image and optionally add white background
    
    Args:
        input_path: Path to input image
        output_path: Path to output image (optional)
        white_background: Whether to add white background instead of transparent
        model: Model to use for background removal (u2net, u2netp, silueta, isnet-general-use, etc.)
    """
    try:
        # Load image
        input_image = Image.open(input_path)
        
        # Create session with specified model
        session = new_session(model)
        
        # Remove background
        output_image = remove(input_image, session=session)
        
        # Add white background if requested
        if white_background:
            # Create white background
            white_bg = Image.new('RGB', output_image.size, (255, 255, 255))
            # Paste the image with transparent background onto white background
            white_bg.paste(output_image, (0, 0), output_image)
            output_image = white_bg
        
        # Generate output path if not provided
        if output_path is None:
            input_path_obj = Path(input_path)
            output_path = str(input_path_obj.parent / f"{input_path_obj.stem}_no_bg{input_path_obj.suffix}")
        
        # Save the result
        output_image.save(output_path)
        print(f"Processed: {input_path} -> {output_path}")
        
    except Exception as e:
        print(f"Error processing {input_path}: {str(e)}")
        return False
    
    return True


def main():
    parser = argparse.ArgumentParser(description="Remove background from T-shirt images")
    parser.add_argument("input", nargs="*", help="Input image files or directory")
    parser.add_argument("-o", "--output", help="Output directory (default: same as input)")
    parser.add_argument("-t", "--transparent", action="store_true", 
                       help="Keep background transparent instead of white")
    parser.add_argument("--all", action="store_true", 
                       help="Process all image files in current directory")
    parser.add_argument("-m", "--model", default="u2net", 
                       choices=["u2net", "u2netp", "u2net_human_seg", "u2net_cloth_seg", "silueta", "isnet-general-use"],
                       help="Model to use for background removal (default: u2net)")
    
    args = parser.parse_args()
    
    # Determine input files
    input_files = []
    
    if args.all:
        # Process all image files in current directory
        current_dir = Path(".")
        for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
            input_files.extend(current_dir.glob(ext))
    elif not args.input:
        # Default: process all image files in current directory
        current_dir = Path(".")
        for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
            input_files.extend(current_dir.glob(ext))
        if not input_files:
            print("No image files found in current directory")
            return
    else:
        # Process specified files/directories
        for item in args.input:
            path = Path(item)
            if path.is_file():
                input_files.append(path)
            elif path.is_dir():
                for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
                    input_files.extend(path.glob(ext))
    
    if not input_files:
        print("No image files found to process")
        return
    
    print(f"Found {len(input_files)} image files to process")
    
    # Process each file
    success_count = 0
    for input_file in input_files:
        output_path = None
        if args.output:
            output_dir = Path(args.output)
            output_dir.mkdir(exist_ok=True)
            output_path = str(output_dir / f"{input_file.stem}{input_file.suffix}")
        
        if remove_background(str(input_file), output_path, not args.transparent, args.model):
            success_count += 1
    
    print(f"\nCompleted: {success_count}/{len(input_files)} files processed successfully")


if __name__ == "__main__":
    main()